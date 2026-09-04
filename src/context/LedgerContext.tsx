import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { clearActiveLedger, loadActiveLedger, saveActiveLedger } from '../lib/activeLedger';
import { supabase } from '../lib/supabase';
import { HouseholdMember } from '../types';
import { useAuth } from './AuthContext';

export type LedgerRole = 'owner' | 'editor' | 'viewer';

/** Um caderno que eu posso abrir: o meu ou o de alguém que me convidou. */
export type Ledger = {
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  role: LedgerRole;
};

type Result = { error: string | null };

type LedgerContextValue = {
  loading: boolean;
  /** Dono do caderno aberto — é ele que carimba `user_id` em tudo que se grava. */
  ownerId: string | null;
  /** Estou olhando o caderno de outra pessoa. */
  isShared: boolean;
  role: LedgerRole;
  canWrite: boolean;
  /** O meu caderno + os que compartilharam comigo. */
  ledgers: Ledger[];
  activeLedger: Ledger | null;
  /** Quem eu convidei para o meu caderno (inclusive convites pendentes). */
  members: HouseholdMember[];
  /** Nome de quem revogou meu acesso enquanto eu estava com o caderno aberto. */
  revokedNotice: string | null;
  clearRevokedNotice: () => void;
  setActiveLedger: (ownerId: string) => Promise<void>;
  invite: (email: string, role: 'viewer' | 'editor') => Promise<Result>;
  changeRole: (rowId: string, role: 'viewer' | 'editor') => Promise<Result>;
  revoke: (rowId: string) => Promise<Result>;
  leave: (ownerId: string) => Promise<Result>;
  refresh: () => Promise<void>;
};

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

/**
 * Traduz o erro do Postgres pelo SQLSTATE, não pela frase: as RPCs falam
 * português e o app também roda em inglês.
 */
function erroDeConvite(e: { code?: string; message?: string } | null): string {
  const codigos: Record<string, string> = {
    MG001: 'selfInvite',
    MG002: 'limit',
    '22023': 'invalidEmail',
    P0002: 'notFound',
    '42501': 'noPermission',
  };
  return (e?.code && codigos[e.code]) || 'generic';
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState<HouseholdMember[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [revokedNotice, setRevokedNotice] = useState<string | null>(null);

  // O `refresh` precisa saber qual caderno está aberto e quais eram os
  // compartilhados, mas não pode se recriar a cada mudança deles: ele é
  // dependência do efeito de realtime, que reassinaria o canal à toa.
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeOwnerId;
  const sharedRef = useRef<HouseholdMember[]>([]);
  sharedRef.current = shared;

  const ownLedger = useMemo<Ledger | null>(() => {
    if (!userId) return null;
    const meta = (session?.user.user_metadata ?? {}) as Record<string, string>;
    return {
      ownerId: userId,
      ownerName: meta.full_name || meta.name || null,
      ownerEmail: session?.user.email ?? '',
      role: 'owner',
    };
  }, [userId, session]);

  const ledgers = useMemo<Ledger[]>(() => {
    if (!ownLedger) return [];
    return [
      ownLedger,
      ...shared.map((h) => ({
        ownerId: h.owner_id,
        ownerName: h.owner_name,
        ownerEmail: h.owner_email,
        role: h.role as LedgerRole,
      })),
    ];
  }, [ownLedger, shared]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [mineRes, membersRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('*')
        .eq('member_id', userId)
        .eq('status', 'active'),
      supabase
        .from('household_members')
        .select('*')
        .eq('owner_id', userId)
        .neq('status', 'revoked')
        .order('created_at'),
    ]);

    const mine = (mineRes.data ?? []) as HouseholdMember[];
    const anteriores = sharedRef.current;
    setShared(mine);
    setMembers((membersRes.data ?? []) as HouseholdMember[]);

    // Acesso revogado com o caderno aberto: sem isto a pessoa ficaria olhando
    // uma tela vazia sem entender o motivo.
    const aberto = activeRef.current;
    if (aberto && aberto !== userId && !mine.some((h) => h.owner_id === aberto)) {
      const antigo = anteriores.find((h) => h.owner_id === aberto);
      setRevokedNotice(antigo?.owner_name || antigo?.owner_email || '');
      // A ref precisa mudar já: o estado só chega no próximo render, e um
      // segundo `refresh` antes disso repetiria o aviso.
      activeRef.current = userId;
      setActiveOwnerId(userId);
      await clearActiveLedger();
    }
  }, [userId]);

  // Entrou: reivindica os convites feitos para este e-mail e carrega os cadernos.
  useEffect(() => {
    let vivo = true;
    if (!userId) {
      setShared([]);
      setMembers([]);
      setActiveOwnerId(null);
      setRevokedNotice(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const guardado = await loadActiveLedger();
      if (!vivo) return;
      setActiveOwnerId(guardado || userId);
      await supabase.rpc('claim_household_invites');
      if (!vivo) return;
      await refresh();
      if (vivo) setLoading(false);
    })();

    return () => {
      vivo = false;
    };
  }, [userId, refresh]);

  // Convite novo enquanto o app estava em segundo plano.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      await supabase.rpc('claim_household_invites');
      await refresh();
    });
    return () => sub.remove();
  }, [userId, refresh]);

  // Aceite e revogação aparecem na hora nas duas pontas.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`household-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `member_id=eq.${userId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const setActiveLedger = useCallback(
    async (novoDono: string) => {
      if (!userId) return;
      const permitido = novoDono === userId || shared.some((h) => h.owner_id === novoDono);
      if (!permitido) return;
      // Idem: sem isto, sair de um caderno dispararia o aviso de acesso
      // revogado, porque o `refresh` seguinte ainda leria o caderno antigo.
      activeRef.current = novoDono;
      setActiveOwnerId(novoDono);
      setRevokedNotice(null);
      if (novoDono === userId) {
        await clearActiveLedger();
      } else {
        await saveActiveLedger(novoDono);
      }
    },
    [userId, shared]
  );

  const invite = useCallback<LedgerContextValue['invite']>(
    async (email, role) => {
      const { error } = await supabase.rpc('invite_member', {
        p_email: email,
        p_role: role,
      });
      if (error) return { error: erroDeConvite(error) };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const changeRole = useCallback<LedgerContextValue['changeRole']>(
    async (rowId, role) => {
      const { error } = await supabase.rpc('set_member_role', {
        p_id: rowId,
        p_role: role,
      });
      if (error) return { error: erroDeConvite(error) };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const revoke = useCallback<LedgerContextValue['revoke']>(
    async (rowId) => {
      const { error } = await supabase.rpc('revoke_member', { p_id: rowId });
      if (error) return { error: erroDeConvite(error) };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const leave = useCallback<LedgerContextValue['leave']>(
    async (donoId) => {
      const { error } = await supabase.rpc('leave_household', { p_owner_id: donoId });
      if (error) return { error: erroDeConvite(error) };
      if (activeRef.current === donoId && userId) await setActiveLedger(userId);
      await refresh();
      return { error: null };
    },
    [refresh, setActiveLedger, userId]
  );

  const activeLedger = useMemo(
    () => ledgers.find((l) => l.ownerId === activeOwnerId) ?? ownLedger,
    [ledgers, activeOwnerId, ownLedger]
  );

  const role: LedgerRole = activeLedger?.role ?? 'owner';

  return (
    <LedgerContext.Provider
      value={{
        loading,
        // Enquanto o caderno guardado não foi validado, escreve-se no próprio:
        // nunca num caderno alheio por engano.
        ownerId: activeLedger?.ownerId ?? userId,
        isShared: !!activeLedger && !!userId && activeLedger.ownerId !== userId,
        role,
        canWrite: role !== 'viewer',
        ledgers,
        activeLedger,
        members,
        revokedNotice,
        clearRevokedNotice: () => setRevokedNotice(null),
        setActiveLedger,
        invite,
        changeRole,
        revoke,
        leave,
        refresh,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger deve ser usado dentro de um LedgerProvider');
  return ctx;
}

import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import React,
  { useEffect,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../src/theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { ColorPicker } from '../src/components/ColorPicker';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { IconPicker } from '../src/components/IconPicker';
import { PressableScale } from '../src/components/PressableScale';
import { useData } from '../src/context/DataContext';
import { useLedger } from '../src/context/LedgerContext';
import { AppIconName } from '../src/data/icons';
import { useT } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeContext';

export default function CategoriaScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; parentId?: string; name?: string }>();
  const { categories, addCategory, updateCategory, deleteCategory } = useData();

  const editing = categories.find((c) => c.id === params.id);
  const parent = categories.find((c) => c.id === (params.parentId ?? editing?.parent_id));
  const isSub = !!(params.parentId || editing?.parent_id);

  // Pré-preenche o nome quando vindo da busca ("Criar '<texto>'").
  const [name, setName] = useState(typeof params.name === 'string' ? params.name : '');
  const [icon, setIcon] = useState<AppIconName>('tag');
  const [color, setColor] = useState(parent?.color ?? '#0EA5A4');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Quantas subcategorias serão removidas junto (só para categoria-mãe).
  const subCount = editing && !isSub
    ? categories.filter((c) => c.parent_id === editing.id).length
    : 0;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setIcon(editing.icon);
      setColor(editing.color);
    } else if (parent) {
      setColor(parent.color);
    }
  }, [editing?.id, parent?.id]);

  const title = editing
    ? isSub
      ? t.categoryForm.editSub
      : t.categoryForm.editCat
    : isSub
      ? t.categoryForm.newSub
      : t.categoryForm.newCat;

  const { canWrite } = useLedger();
  // Caderno de outra pessoa em modo leitura: a tela vira detalhe da categoria.
  const canSave = name.trim().length > 0 && !saving && canWrite;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      icon,
      color: isSub ? parent?.color ?? color : color,
      parent_id: editing?.parent_id ?? params.parentId ?? null,
    };

    if (editing) {
      await updateCategory(editing.id, payload);
    } else {
      await addCategory(payload);
    }
    router.back();
  }

  async function doDelete() {
    if (!editing) return;
    setDeleting(true);
    await deleteCategory(editing.id);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <MaterialCommunityIcons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {editing && canWrite ? (
          <Pressable onPress={() => setConfirmOpen(true)} hitSlop={12} style={styles.headerBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.danger} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Pré-visualização + escolher ícone */}
        <View style={styles.preview}>
          <Pressable onPress={() => setPickerOpen(true)}>
            <CategoryIcon icon={icon} color={isSub ? parent?.color ?? color : color} size={88} solid />
          </Pressable>
          <Pressable onPress={() => setPickerOpen(true)} style={styles.changeIcon}>
            <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.changeIconText, { color: colors.primary }]}>
              {t.categoryForm.changeIcon}
            </Text>
          </Pressable>
        </View>

        {isSub && parent && (
          <Text style={[styles.parentHint, { color: colors.textMuted }]}>
            {t.categoryForm.childOf}{' '}
            <Text style={{ fontWeight: '700' }}>{parent.name}</Text>
          </Text>
        )}

        {/* Nome */}
        <Text style={[styles.label, { color: colors.text }]}>{t.categoryForm.name}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={
            isSub ? t.categoryForm.subNamePlaceholder : t.categoryForm.catNamePlaceholder
          }
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ]}
          autoFocus={!editing}
        />

        {/* Cor (apenas para categoria-mãe) */}
        {!isSub && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>{t.categoryForm.color}</Text>
            <ColorPicker selected={color} onSelect={setColor} />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <PressableScale
          onPress={handleSave}
          disabled={!canSave}
          scaleTo={0.97}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.surface }]}
        >
          <Text
            style={[styles.saveText, { color: canSave ? colors.onPrimary : colors.textMuted }]}
          >
            {t.common.save}
          </Text>
        </PressableScale>
      </View>
      </KeyboardAvoidingView>

      <IconPicker
        visible={pickerOpen}
        selected={icon}
        color={isSub ? parent?.color ?? color : color}
        onSelect={setIcon}
        onClose={() => setPickerOpen(false)}
      />

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        visible={confirmOpen}
        title={t.categoryForm.deleteTitle(
          isSub ? t.categoryForm.kindSub : t.categoryForm.kindCat,
          editing?.name ?? name
        )}
        message={`${
          isSub
            ? t.categoryForm.deleteSubMessage
            : subCount > 0
              ? t.categoryForm.deleteCatWithSubs(subCount)
              : t.categoryForm.deleteCatMessage
        } ${t.categoryForm.undoWarning}`}
        preview={
          <CategoryIcon
            icon={editing?.icon ?? icon}
            color={editing?.color ?? (isSub ? parent?.color ?? color : color)}
            size={64}
            solid
          />
        }
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: {
    padding: 20,
    gap: 8,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  preview: { alignItems: 'center', gap: 10, marginVertical: 10 },
  changeIcon: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  changeIconText: { fontSize: 15, fontWeight: '600' },
  parentHint: { textAlign: 'center', fontSize: 14, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 4 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 16,
  },
  footer: { padding: 16, borderTopWidth: 1 },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  saveText: { fontSize: 18, fontWeight: '700' },
});

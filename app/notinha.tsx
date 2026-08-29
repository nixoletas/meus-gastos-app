import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../src/i18n';
import { receiptSignedUrl } from '../src/lib/receipts';
import { supabase } from '../src/lib/supabase';
import { Text } from '../src/theme/typography';
import { Receipt } from '../src/types';

/**
 * Foto da notinha em tela cheia.
 *
 * O bucket é privado: a imagem só aparece por uma URL assinada, que a gente
 * pede na hora e vale por uma hora.
 */
export default function NotinhaScreen() {
  const router = useRouter();
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!id) {
      setError(t.receiptPhoto.notFound);
      return;
    }

    (async () => {
      const { data } = await supabase.from('receipts').select('*').eq('id', id).maybeSingle();
      if (!alive) return;
      if (!data) {
        setError(t.receiptPhoto.notFound);
        return;
      }
      const encontrada = data as Receipt;
      setReceipt(encontrada);

      // Notinha lida por QR Code não tem foto para mostrar.
      if (!encontrada.storage_path) {
        setError(t.receiptPhoto.fromQr);
        return;
      }

      const signed = await receiptSignedUrl(encontrada.storage_path);
      if (!alive) return;
      if (!signed) setError(t.receiptPhoto.cantOpen);
      setUrl(signed);
    })();

    return () => {
      alive = false;
    };
  }, [id, t]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {receipt?.merchant ?? t.receiptPhoto.title}
        </Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsVerticalScrollIndicator={false}
      >
        {url ? (
          <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.center}>
            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <ActivityIndicator color="#FFFFFF" />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  content: { flexGrow: 1, justifyContent: 'center' },
  image: { width: '100%', height: '100%', minHeight: 420, flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  error: { color: '#F1F5F9', fontSize: 15 },
});

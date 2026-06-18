import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * Efeitos sonoros sutis da interface (substituem a vibração).
 * - Navegação/cliques: som "click"
 * - Digitação (texto/valor): som "type" (mais curto e agudo)
 * - Sucesso e erro têm sons próprios e delicados.
 *
 * Tudo é best-effort: se o áudio falhar (ex.: web sem permissão), vira no-op.
 */

let click: AudioPlayer | null = null;
let typeTick: AudioPlayer | null = null;
let success: AudioPlayer | null = null;
let error: AudioPlayer | null = null;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  try {
    click = createAudioPlayer(require('../../assets/sounds/click.wav'));
    typeTick = createAudioPlayer(require('../../assets/sounds/type.wav'));
    success = createAudioPlayer(require('../../assets/sounds/success.wav'));
    error = createAudioPlayer(require('../../assets/sounds/error.wav'));
    for (const p of [click, typeTick, success, error]) {
      if (p) p.volume = 0.7;
    }
  } catch {
    // Áudio indisponível — segue sem som.
  }
}

function play(player: AudioPlayer | null) {
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignora falhas de reprodução
  }
}

/** Som de clique para ações de navegação (botões, chips, seleção). */
export function playClick() {
  init();
  play(click);
}

/** Som curto de digitação (campos de texto e valor). */
export function playType() {
  init();
  play(typeTick);
}

/** Som de sucesso (ex.: gasto lançado). */
export function playSuccess() {
  init();
  play(success);
}

/** Som de erro/aviso suave. */
export function playError() {
  init();
  play(error);
}

// Aliases de compatibilidade com os antigos nomes de feedback.
export const tapLight = playClick;
export const tapMedium = playClick;
export const notifySuccess = playSuccess;
export const notifyWarning = playError;

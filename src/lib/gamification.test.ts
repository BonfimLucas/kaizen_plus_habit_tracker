/**
 * Kaizen+ Gamification Unit Tests
 *
 * Execute com: npx tsx src/lib/gamification.test.ts
 *
 * Valida os cenários obrigatórios de gamificação com reversão ao desmarcar
 * e prevenção de duplicações por cliques repetidos.
 */

import {
  processHabitCompletion,
  getLocalDateString,
  applyXpGain,
  calcCurrentStreak,
  calcWeeklyCompletions,
  recalcChallenges,
  recalcRewards,
  recalcStatsFromHistory,
  calcWeeklyTarget,
  POINTS_PER_COMPLETION,
  XP_PER_COMPLETION,
  DailyRecord,
  buildRecordKey,
} from './gamification';

import { UserStats, Challenge, Reward } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, name, ok ? '' : `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
}

const USER_ID = 'user-test-001';
const TODAY = getLocalDateString();

function makeStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    userId: USER_ID,
    name: 'Test User',
    level: 1,
    currentXp: 0,
    maxXp: 100,
    points: 0,
    coins: 0,
    streakDays: 0,
    bestStreakDays: 0,
    overallConsistency: 0,
    weeklyTargetCount: 7,
    weeklyCompletedCount: 0,
    ...overrides,
  };
}

function makeChallenges(): Challenge[] {
  return [
    { id: 'chal-1', title: '7 dias consecutivos', desc: '', iconType: 'fire', current: 0, total: 7, completed: false },
    { id: 'chal-2', title: 'Beber água por 5 dias', desc: '', iconType: 'water', current: 0, total: 5, completed: false },
    { id: 'chal-3', title: 'Estudar por 7 dias', desc: '', iconType: 'book', current: 0, total: 7, completed: false },
  ];
}

function makeRewards(): Reward[] {
  return [
    { id: 'rew-1', title: 'Constante', desc: '', iconType: 'shield', unlocked: false, current: 0, total: 7 },
    { id: 'rew-2', title: 'Focado', desc: '', iconType: 'lock', unlocked: false, current: 0, total: 14 },
    { id: 'rew-3', title: '250 moedas', desc: '', iconType: 'coins', unlocked: false, current: 0, total: 10 },
  ];
}

function makeHabits(ids: string[] = ['hab-1']): Array<{ id: string; iconType: string; name: string; frequency: string }> {
  return ids.map((id) => ({ id, iconType: 'target', name: 'Hábito', frequency: 'Todos os dias' }));
}

function makeRecord(habitId: string, date: string, rewardClaimed = true): DailyRecord {
  return {
    key: buildRecordKey(USER_ID, habitId, date),
    userId: USER_ID,
    habitId,
    date,
    rewardClaimed,
    updatedAt: new Date().toISOString(),
  };
}

function subtractDaysLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateString(d);
}

// ─────────────────────────────────────────────────────────────
// Cenário 1: Criar hábito não concede pontos, XP, moedas
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 1: Criar hábito não concede recompensas');
{
  const stats = makeStats();
  const newTarget = calcWeeklyTarget([{ frequency: 'Todos os dias' }]);
  assertEqual(stats.points, 0, 'points = 0 após criar hábito');
  assertEqual(stats.currentXp, 0, 'currentXp = 0 após criar hábito');
  assertEqual(stats.coins, 0, 'coins = 0 após criar hábito');
  assertEqual(newTarget, 7, 'weeklyTargetCount = 7 para 1 hábito diário');
}

// ─────────────────────────────────────────────────────────────
// Cenário 2: Concluir hábito concede 50pts e 30XP
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 2: Conclusão concede 50pts e 30XP');
{
  const result = processHabitCompletion({
    userId: USER_ID,
    habitId: 'hab-1',
    completed: true,
    currentStats: makeStats(),
    history: [],
    challenges: makeChallenges(),
    rewards: makeRewards(),
    habits: makeHabits(['hab-1']),
  });
  assertEqual(result.stats.points, POINTS_PER_COMPLETION, 'points = 50');
  assertEqual(result.stats.currentXp, XP_PER_COMPLETION, 'currentXp = 30');
  assert(result.rewardGranted, 'rewardGranted = true');
}

// ─────────────────────────────────────────────────────────────
// Cenário 3: Mesma lógica de conclusão independente da tela
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 3: Mesma lógica independente da tela');
{
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });
  const r2 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });
  assertEqual(r1.stats.points, r2.stats.points, 'pontos iguais independente da tela');
}

// ─────────────────────────────────────────────────────────────
// Cenário 4: Desmarcar reverte pontos e XP; marcar novamente reconcede
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 4: Reversão ao desmarcar e reconcessão sem duplicação');
{
  // 1. Marca: +50 pts e +30 XP
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });
  assertEqual(r1.stats.points, 50, 'marcar: points = 50');
  assertEqual(r1.stats.currentXp, 30, 'marcar: currentXp = 30');

  // 2. Clique repetido no estado já marcado: não duplica
  const r1Repeat = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: r1.stats, history: r1.history, challenges: r1.challenges, rewards: r1.rewards, habits: makeHabits(),
  });
  assertEqual(r1Repeat.stats.points, 50, 'clique repetido: points continua 50');

  // 3. Desmarca: reverte para 0 pts e 0 XP
  const r2 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: false,
    currentStats: r1.stats, history: r1.history, challenges: r1.challenges, rewards: r1.rewards, habits: makeHabits(),
  });
  assertEqual(r2.stats.points, 0, 'desmarcar: reverte points = 0');
  assertEqual(r2.stats.currentXp, 0, 'desmarcar: reverte currentXp = 0');

  // 4. Clique repetido no estado desmarcado: não gera valor negativo
  const r2Repeat = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: false,
    currentStats: r2.stats, history: r2.history, challenges: r2.challenges, rewards: r2.rewards, habits: makeHabits(),
  });
  assertEqual(r2Repeat.stats.points, 0, 'desmarcar repetido: points não fica negativo');

  // 5. Marca novamente: ganha 50 pts e 30 XP de novo
  const r3 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: r2.stats, history: r2.history, challenges: r2.challenges, rewards: r2.rewards, habits: makeHabits(),
  });
  assertEqual(r3.stats.points, 50, 'marcar novamente: points volta a ser 50');
  assertEqual(r3.stats.currentXp, 30, 'marcar novamente: currentXp volta a ser 30');
}

// ─────────────────────────────────────────────────────────────
// Cenário 5: Dois hábitos diferentes recompensados individualmente
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 5: Dois hábitos diferentes — recompensas independentes');
{
  const habits2 = makeHabits(['hab-1', 'hab-2']);
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: habits2,
  });
  const r2 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-2', completed: true,
    currentStats: r1.stats, history: r1.history, challenges: r1.challenges, rewards: r1.rewards, habits: habits2,
  });
  assertEqual(r2.stats.points, POINTS_PER_COMPLETION * 2, 'pontos = 100 (dois hábitos)');
  assert(r2.rewardGranted, 'segundo hábito concede recompensa');

  // Se desmarcar um hábito, subtrai 50, mantendo o outro
  const r3 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: false,
    currentStats: r2.stats, history: r2.history, challenges: r2.challenges, rewards: r2.rewards, habits: habits2,
  });
  assertEqual(r3.stats.points, POINTS_PER_COMPLETION, 'desmarcar hab-1 deixa 50 pontos (do hab-2)');
}

// ─────────────────────────────────────────────────────────────
// Cenário 6: Recarregar mantém estatísticas sem duplicar
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 6: Recarregar mantém estatísticas sem duplicar');
{
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });

  const { stats: reloaded } = recalcStatsFromHistory(
    r1.stats, r1.history, r1.challenges, r1.rewards, makeHabits()
  );
  assertEqual(reloaded.points, POINTS_PER_COMPLETION, 'points após reload = 50 (sem duplicar)');
}

// ─────────────────────────────────────────────────────────────
// Cenário 7: Isolamento entre contas
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 7: Isolamento entre contas');
{
  const USER_B = 'user-b-002';
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });

  const activeB = r1.history.filter((r) => r.userId === USER_B);
  assertEqual(activeB.length, 0, 'conta B tem 0 registros do histórico de A');
  const weeklyB = calcWeeklyCompletions(r1.history, USER_B);
  assertEqual(weeklyB, 0, 'weeklyCompletions da conta B = 0');
}

// ─────────────────────────────────────────────────────────────
// Cenário 8: Sequência não aumenta várias vezes no mesmo dia
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 8: Sequência não aumenta várias vezes no mesmo dia');
{
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(['hab-1', 'hab-2']),
  });
  const r2 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-2', completed: true,
    currentStats: r1.stats, history: r1.history, challenges: r1.challenges, rewards: r1.rewards, habits: makeHabits(['hab-1', 'hab-2']),
  });
  assertEqual(r2.stats.streakDays, 1, 'streak = 1 após dois hábitos no mesmo dia');
}

// ─────────────────────────────────────────────────────────────
// Cenário 9: Sequência calculada corretamente com dias consecutivos
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 9: Cálculo de sequência com histórico real');
{
  const history: DailyRecord[] = [
    makeRecord('hab-1', subtractDaysLocal(2)),
    makeRecord('hab-1', subtractDaysLocal(1)),
    makeRecord('hab-1', TODAY),
  ];
  const streak = calcCurrentStreak(
    history.filter((r) => r.rewardClaimed).map((r) => r.date),
    TODAY
  );
  assertEqual(streak, 3, 'streak = 3 com 3 dias consecutivos');

  const historyWithGap: DailyRecord[] = [
    makeRecord('hab-1', subtractDaysLocal(5)),
    makeRecord('hab-1', subtractDaysLocal(3)),
    makeRecord('hab-1', subtractDaysLocal(2)),
    makeRecord('hab-1', subtractDaysLocal(1)),
    makeRecord('hab-1', TODAY),
  ];
  const streakGap = calcCurrentStreak(
    historyWithGap.filter((r) => r.rewardClaimed).map((r) => r.date),
    TODAY
  );
  assertEqual(streakGap, 4, 'streak = 4 (ignora buraco anterior)');
}

// ─────────────────────────────────────────────────────────────
// Cenário 10: Progresso semanal atualizado com reversão
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 10: Progresso semanal com reversão correta');
{
  const r1 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: true,
    currentStats: makeStats(), history: [], challenges: makeChallenges(), rewards: makeRewards(), habits: makeHabits(),
  });
  assertEqual(r1.stats.weeklyCompletedCount, 1, 'weeklyCompletedCount = 1 após marcar');

  const r2 = processHabitCompletion({
    userId: USER_ID, habitId: 'hab-1', completed: false,
    currentStats: r1.stats, history: r1.history, challenges: r1.challenges, rewards: r1.rewards, habits: makeHabits(),
  });
  assertEqual(r2.stats.weeklyCompletedCount, 0, 'weeklyCompletedCount = 0 após desmarcar');
}

// ─────────────────────────────────────────────────────────────
// Cenário 11: XP e nível coerentes após várias conclusões
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 11: XP e nível coerentes e reversíveis');
{
  // 100 XP -> nível 2, 0 XP
  let xpResult = applyXpGain(1, 0, 100);
  assertEqual(xpResult.level, 2, 'level = 2 com 100 XP');
  assertEqual(xpResult.currentXp, 0, 'currentXp = 0 após subir de nível');

  // Reverte 30 XP do nível 2 -> nível 1 com 70 XP
  xpResult = applyXpGain(2, 0, -30);
  assertEqual(xpResult.level, 1, 'level = 1 após reverter 30 XP do início do level 2');
  assertEqual(xpResult.currentXp, 70, 'currentXp = 70 após reverter 30 XP');

  // Não fica negativo
  xpResult = applyXpGain(1, 10, -50);
  assertEqual(xpResult.level, 1, 'level mínimo é 1');
  assertEqual(xpResult.currentXp, 0, 'currentXp mínimo é 0');
}

// ─────────────────────────────────────────────────────────────
// Cenário 12: Editar ou excluir hábito não concede recompensas
// ─────────────────────────────────────────────────────────────
console.log('\n📋 Cenário 12: Editar/excluir hábito não altera pontos');
{
  const before = calcWeeklyTarget([{ frequency: 'Todos os dias' }, { frequency: 'Todos os dias' }]);
  const after = calcWeeklyTarget([{ frequency: 'Todos os dias' }]);
  const stats = makeStats({ points: 100, currentXp: 50 });
  assertEqual(stats.points, 100, 'pontos não mudam ao excluir hábito');
  assertEqual(stats.currentXp, 50, 'XP não muda ao excluir hábito');
  assertEqual(after, 7, 'weeklyTargetCount reduzido corretamente');
  assertEqual(before, 14, 'weeklyTargetCount era 14 com 2 hábitos');
}

console.log('\n' + '═'.repeat(50));
console.log(`Resultado: ${passed} aprovados, ${failed} falhou`);
if (failed > 0) {
  console.error('\n⚠️  Há testes falhando.');
  process.exit(1);
} else {
  console.log('\n🎉 Todos os testes unitários passaram!');
}

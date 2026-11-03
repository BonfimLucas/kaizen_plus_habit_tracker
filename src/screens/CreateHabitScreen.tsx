import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Habit, HabitCategory, HabitFrequency, ScreenType } from '../types';

interface CreateHabitScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onAddHabit: (habit: Habit) => void;
}

export const CreateHabitScreen: React.FC<CreateHabitScreenProps> = ({
  onNavigate,
  onAddHabit,
}) => {
  const [name, setName] = useState('Beber água');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('Saúde');
  const [selectedFreq, setSelectedFreq] = useState<HabitFrequency>('Todos os dias');
  const [goal, setGoal] = useState<number>(8);
  const [selectedUnit, setSelectedUnit] = useState<string>('Copos');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const unitsList = ['Copos', 'Minutos', 'Vezes', 'Horas', 'Páginas', 'Treinos'];

  const categoryIcons: Record<HabitCategory, React.ReactNode> = {
    Saúde: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    Produtividade: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" fill="currentColor" r="1.5" />
      </svg>
    ),
    Mindfulness: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3c-1.5 3-4 6-7 7 2.5 1.5 5 1.5 7 0 2 1.5 4.5 1.5 7 0-3-1-5.5-4-7-7zm0 9c-2 2-4.5 3.5-7.5 4 3 2.5 6 2 7.5 1 1.5 1 4.5 1.5 7.5-1-3-.5-5.5-2-7.5-4zm0 6c-1.5 1-3.5 1.5-5.5 1.5 2.5 1.5 4.5 1 5.5 0 1 1 3 1.5 5.5 0-2 0-4-.5-5.5-1.5z" />
      </svg>
    ),
    Estudos: (
      <svg className="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    Outros: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    ),
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    setIsSuccess(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#4ade80', '#3ee67d', '#ffffff'],
    });

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category: selectedCategory,
      frequency: selectedFreq,
      goalNumber: goal || 1,
      unit: selectedUnit.toLowerCase(),
      completedToday: false,
      streakDays: 0,
      iconType: selectedCategory === 'Estudos' ? 'book' : selectedCategory === 'Saúde' ? 'water' : 'target',
    };

    onAddHabit(newHabit);

    setTimeout(() => {
      onNavigate('habits');
    }, 900);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col px-5 pt-1 pb-24 overflow-y-auto no-scrollbar">
      {/* Header Section */}
      <section className="flex items-start justify-between mt-2 mb-5">
        <div className="flex items-start space-x-3.5">
          {/* Botão Voltar */}
          <button
            aria-label="Voltar"
            onClick={() => onNavigate('habits')}
            className="mt-0.5 w-10 h-10 rounded-full bg-[#1b1c1b] border border-[#262826] flex items-center justify-center text-white/90 hover:bg-[#242624] transition-colors cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="max-w-[210px]">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Criar hábito</h1>
            <p className="text-[11.5px] text-[#8e938e] mt-1 leading-snug">
              Defina os detalhes do seu novo hábito e comece a construir consistência.
            </p>
          </div>
        </div>

      </section>

      {/* Form Fields */}
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        {/* Campo Nome */}
        <div className="bg-[#1b1c1b] border border-[#252725] rounded-2xl p-3.5 shadow-sm">
          <label className="block text-xs font-semibold text-gray-200 mb-2 tracking-wide" htmlFor="habitNameInput">
            Nome
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full bg-[#121312] border border-[#282a28] rounded-xl py-2.5 pl-2 pr-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] transition-colors font-normal"
              id="habitNameInput"
              placeholder="Ex: Ler 10 páginas"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-[#717571] mt-2 font-normal">Digite um nome claro e positivo para o seu hábito.</p>
        </div>

        {/* Campo Categoria */}
        <div className="bg-[#1b1c1b] border border-[#252725] rounded-2xl p-3.5 shadow-sm">
          <label className="block text-xs font-semibold text-gray-200 mb-2 tracking-wide">Categoria</label>
          
          {/* Dropdown Display */}
          <div className="w-full bg-[#121312] border border-[#282a28] rounded-xl py-2.5 px-3 flex items-center justify-between text-sm text-gray-200 mb-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-[#4ade80]">{categoryIcons[selectedCategory]}</span>
              <span className="font-medium text-xs">{selectedCategory}</span>
            </div>
          </div>
          <p className="text-[10px] text-[#717571] mb-2.5 font-normal">Escolha uma categoria que melhor se encaixa.</p>

          {/* Grid buttons */}
          <div className="grid grid-cols-5 gap-1.5" data-purpose="category-selector">
            {(['Saúde', 'Produtividade', 'Mindfulness', 'Estudos'] as HabitCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'border border-[#4ade80] bg-[#162419] text-[#4ade80]'
                    : 'border border-[#262826] bg-[#141514] text-[#8e938e] hover:border-gray-600'
                }`}
              >
                <div className="mb-1">{categoryIcons[cat]}</div>
                <span className="text-[9.5px] font-medium leading-none truncate max-w-full">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Campo Frequência */}
        <div className="bg-[#1b1c1b] border border-[#252725] rounded-2xl p-3.5 shadow-sm">
          <label className="block text-xs font-semibold text-gray-200 mb-2 tracking-wide">Frequência</label>
          <div className="w-full bg-[#121312] border border-[#282a28] rounded-xl py-2.5 px-3 flex items-center justify-between text-sm text-gray-200 mb-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="font-medium text-xs">{selectedFreq}</span>
            </div>
          </div>
          <p className="text-[10px] text-[#717571] mb-2.5 font-normal">Com que frequência você quer realizar este hábito?</p>

          {/* Quick pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['Todos os dias', 'Dias úteis', 'Semanal'] as HabitFrequency[]).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setSelectedFreq(freq)}
                className={`py-2 px-1 text-center rounded-xl text-[10.5px] font-medium transition-all cursor-pointer ${
                  selectedFreq === freq
                    ? 'border border-[#4ade80] bg-[#162419] text-[#4ade80]'
                    : 'border border-[#262826] bg-[#141514] text-[#8e938e] hover:border-gray-600'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Seção Meta & Unidade */}
        <div className="bg-[#1b1c1b] border border-[#252725] rounded-2xl p-3.5 shadow-sm space-y-3.5">
          {/* Meta Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-2 tracking-wide" htmlFor="metaInput">
              Meta
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-[#4ade80]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" fill="currentColor" r="1.5" />
                </svg>
              </div>
              <input
                className="w-full bg-[#121312] border border-[#282a28] rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] font-normal"
                id="metaInput"
                min="1"
                type="number"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
              />
            </div>
            <p className="text-[10px] text-[#717571] mt-2 font-normal">Defina a quantidade que deseja alcançar.</p>
          </div>

          {/* Unidade Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-200 mb-2 tracking-wide">Unidade</label>
            <div
              onClick={() => setShowUnitDropdown(!showUnitDropdown)}
              className="w-full bg-[#121312] border border-[#282a28] rounded-xl py-2.5 px-3 flex items-center justify-between text-sm text-gray-200 cursor-pointer hover:border-[#383a38] transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <span className="font-medium text-xs">{selectedUnit}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Dropdown Options */}
            {showUnitDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-[#1c1e1c] border border-[#2a2d2a] rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                {unitsList.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setSelectedUnit(u);
                      setShowUnitDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#252825] transition cursor-pointer ${
                      selectedUnit === u ? 'text-[#4ade80] font-semibold bg-[#162419]' : 'text-gray-300'
                    }`}
                  >
                    <span>{u}</span>
                    {selectedUnit === u && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-[#717571] mt-2 font-normal">Selecione a unidade de medida da sua meta.</p>
          </div>
        </div>
      </form>

      {/* Floating Bottom Action Area */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto px-5 pt-3 pb-3 bg-gradient-to-t from-[#141514] via-[#141514]/95 to-transparent z-40 flex flex-col items-center">
        <button
          onClick={handleCreate}
          type="button"
          className={`w-full h-12 rounded-2xl font-semibold text-[14.5px] flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer ${
            isSuccess
              ? 'bg-white text-black scale-[0.98]'
              : 'bg-[#4ade80] hover:bg-[#43cd76] active:scale-[0.98] text-[#0c2411]'
          }`}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full border-[1.8px] border-current">
            <svg className="w-3.5 h-3.5 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{isSuccess ? 'Hábito criado com sucesso!' : 'Criar hábito'}</span>
        </button>

      </footer>
    </div>
  );
};

export interface GeneratorField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date'
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
}

export interface GeneratorModule {
  slug: string
  title: string
  description: string
  icon: string // emoji, simples e leve
  color: string // cor de destaque do card
  available: boolean
  fields: GeneratorField[]
}

export const GENERATORS: GeneratorModule[] = [
  {
    slug: 'pauta-reuniao',
    title: 'Pauta de Reunião',
    description: 'Monta a pauta certa pra cada momento do ciclo (início/meio/fim de mês, semana, feedback, início de ano).',
    icon: '📋',
    color: '#6B1E2E',
    available: true,
    fields: [
      {
        key: 'tipo_reuniao',
        label: 'Tipo de reunião',
        type: 'select',
        required: true,
        options: [
          { value: 'auto', label: 'Não sei — me ajude a identificar' },
          { value: 'inicio_mes', label: 'Início de Mês' },
          { value: 'meio_mes', label: 'Meio de Mês' },
          { value: 'ultima_semana_mes', label: 'Última Semana do Mês' },
          { value: 'inicio_semana', label: 'Início da Semana' },
          { value: 'feedback_individual', label: 'Feedback Individual' },
          { value: 'primeira_reuniao_ano', label: 'Primeira Reunião do Ano' },
        ],
      },
      {
        key: 'contexto',
        label: 'Contexto (equipe, metas, números, o que quer abordar)',
        type: 'textarea',
        placeholder: 'Ex: reunião com a equipe de 5 pessoas, metas de agendamento estavam em 80% do previsto...',
        required: false,
      },
      {
        key: 'data_participantes',
        label: 'Data e participantes (opcional)',
        type: 'text',
        placeholder: 'Ex: 05/07, com toda a equipe',
        required: false,
      },
    ],
  },
  {
    slug: 'marketing',
    title: 'Ação de Marketing',
    description: 'Monta os 8 itens obrigatórios de uma ação (conceito, decoração, experiência, estratégia, reels, chamada, promoções, cronograma) com 30 dias de antecedência.',
    icon: '📱',
    color: '#9E7E3A',
    available: true,
    fields: [
      {
        key: 'nome_acao',
        label: 'Nome da ação / data comemorativa',
        type: 'text',
        placeholder: 'Ex: Dia das Mães',
        required: true,
      },
      {
        key: 'data_acao',
        label: 'Data da ação',
        type: 'date',
        required: true,
      },
      {
        key: 'contexto',
        label: 'Detalhes extras (opcional)',
        type: 'textarea',
        placeholder: 'Ex: já temos parceria com uma floricultura, queremos incluir combo casal...',
        required: false,
      },
    ],
  },
  {
    slug: 'comercial',
    title: 'Roteiro Comercial',
    description: 'Em breve: roteiro de consulta e scripts comerciais personalizados a partir do caso da paciente.',
    icon: '🤝',
    color: '#4A7A3E',
    available: false,
    fields: [],
  },
]

export function getGenerator(slug: string) {
  return GENERATORS.find(g => g.slug === slug)
}

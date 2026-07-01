import { NextRequest, NextResponse } from 'next/server'
import { MARKETING_ANUAL_SKILL } from '@/lib/generators/marketing-anual-skill'

export const dynamic = 'force-dynamic'

function formatDatePt(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada no servidor.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { nome_acao, data_acao, contexto } = body as {
      nome_acao?: string
      data_acao?: string
      contexto?: string
    }

    if (!nome_acao || !data_acao) {
      return NextResponse.json({ error: 'Informe o nome da ação e a data.' }, { status: 400 })
    }

    const hojeIso = new Date().toISOString().slice(0, 10)

    const userMessage = [
      `Ação/data comemorativa: ${nome_acao}`,
      `Data da ação: ${formatDatePt(data_acao)} (${data_acao})`,
      `Data de hoje: ${formatDatePt(hojeIso)} (${hojeIso})`,
      contexto ? `Detalhes extras fornecidos pela equipe:\n${contexto}` : 'Nenhum detalhe extra fornecido.',
      '',
      'Monte a entrega completa seguindo a seção "Formato de Entrega" da skill: Bloco 1 (os 8 itens desenvolvidos por extenso) e Bloco 2 (checklist com prazos, calculando a data-limite de 30 dias antes e distribuindo as datas-alvo de cada item entre hoje e essa data-limite). Sinalize claramente se já estamos atrasados em relação ao prazo de 30 dias. Responda apenas com o conteúdo em si, em formato de texto escaneável, pronto para copiar e usar — não inclua explicações sobre o que você está fazendo.',
    ].filter(Boolean).join('\n\n')

    const systemPrompt = [
      'Você está operando como a skill "marketing-anual-clinica" dentro do Sistema POP da Clínica Sarah Pina.',
      'Siga rigorosamente as instruções da skill abaixo — identidade visual, calendário de datas, regra dos 30 dias, os 8 itens obrigatórios e o formato de entrega em dois blocos. Não invente itens ou estrutura fora do que está no material.',
      '',
      '=== SKILL.md ===',
      MARKETING_ANUAL_SKILL,
    ].join('\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erro Anthropic API:', errText)
      return NextResponse.json({ error: 'Erro ao gerar a ação. Tente novamente.' }, { status: 502 })
    }

    const data = await response.json()
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')
      .trim()

    if (!text) {
      return NextResponse.json({ error: 'A resposta veio vazia. Tente novamente.' }, { status: 502 })
    }

    return NextResponse.json({ output: text })
  } catch (err) {
    console.error('Erro no gerador de marketing:', err)
    return NextResponse.json({ error: 'Erro inesperado ao gerar a ação.' }, { status: 500 })
  }
}

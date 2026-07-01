import { NextRequest, NextResponse } from 'next/server'
import { PAUTA_REUNIAO_SKILL, PAUTA_REUNIAO_ROTEIROS } from '@/lib/generators/pauta-reuniao-skill'

export const dynamic = 'force-dynamic'

const TIPO_LABELS: Record<string, string> = {
  auto: '',
  inicio_mes: 'Reunião de Início de Mês',
  meio_mes: 'Reunião de Meio de Mês',
  ultima_semana_mes: 'Reunião de Última Semana do Mês',
  inicio_semana: 'Reunião de Início da Semana',
  feedback_individual: 'Reunião de Feedback Individual',
  primeira_reuniao_ano: 'Primeira Reunião do Ano',
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
    const { tipo_reuniao, contexto, data_participantes } = body as {
      tipo_reuniao?: string
      contexto?: string
      data_participantes?: string
    }

    const tipoLabel = tipo_reuniao ? TIPO_LABELS[tipo_reuniao] : ''

    const userMessage = [
      tipoLabel
        ? `Tipo de reunião: ${tipoLabel}`
        : 'Tipo de reunião: não especificado — identifique o roteiro mais adequado com base no contexto abaixo. Se não der pra saber com segurança, pergunte objetivamente qual roteiro usar em vez de assumir.',
      contexto ? `Contexto fornecido pela equipe:\n${contexto}` : 'Nenhum contexto adicional fornecido — monte a pauta com os campos genéricos do roteiro, deixando placeholders claros para preencher.',
      data_participantes ? `Data/participantes: ${data_participantes}` : '',
      '',
      'Monte a pauta completa seguindo o Passo 3 e 4 da skill. Responda apenas com a pauta em si, em formato de texto escaneável (tópicos e sub-bullets), pronta para copiar e usar. Não inclua explicações sobre o que você está fazendo.',
    ].filter(Boolean).join('\n\n')

    const systemPrompt = [
      'Você está operando como a skill "pauta-reuniao" dentro do Sistema POP da Clínica Sarah Pina.',
      'Siga rigorosamente as instruções da skill abaixo (SKILL.md) e use o conteúdo de referência (roteiros.md) como fonte dos roteiros — não invente estrutura, perguntas ou princípios que não estejam no material.',
      '',
      '=== SKILL.md ===',
      PAUTA_REUNIAO_SKILL,
      '',
      '=== references/roteiros.md ===',
      PAUTA_REUNIAO_ROTEIROS,
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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erro Anthropic API:', errText)
      return NextResponse.json({ error: 'Erro ao gerar a pauta. Tente novamente.' }, { status: 502 })
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
    console.error('Erro no gerador de pauta:', err)
    return NextResponse.json({ error: 'Erro inesperado ao gerar a pauta.' }, { status: 500 })
  }
}

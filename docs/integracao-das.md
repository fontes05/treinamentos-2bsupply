# Sincronização do DAS (Simples Nacional)

O botão **Sincronizar DAS**, na página de Rentabilidade, consulta o serviço
`PGDASD / GERARDAS12` da API Integra Contador (Serpro). A declaração do mês
precisa já ter sido transmitida pela contabilidade. O sistema não transmite
declarações e não calcula o imposto a partir das vendas da Hotmart.

## Pré-requisitos

1. Contratar o Integra Contador no Serpro e obter Consumer Key e Consumer Secret.
2. Obter o certificado digital e-CNPJ A1 (`.pfx`/`.p12`) do contratante da API.
   O CNPJ do certificado precisa corresponder ao CNPJ do contrato.
3. Se o contratante não for o contribuinte, providenciar a procuração eletrônica
   para **PGDAS-D - a partir de 01/2018** (código 00146). Se o software operar
   em nome do procurador, será necessário também o fluxo de autorização
   Autentica Procurador documentado pelo Serpro; esse fluxo não está implementado.
4. Configurar estas variáveis **somente no servidor** (`.env.local` e Vercel):

   ```text
   SERPRO_CONSUMER_KEY=
   SERPRO_CONSUMER_SECRET=
   SERPRO_CERT_PFX_BASE64=
   SERPRO_CERT_PASSWORD=
   SERPRO_CONTRATANTE_CNPJ=
   SERPRO_CONTRIBUINTE_CNPJ=
   SERPRO_AUTOR_CNPJ=
   ```

   `SERPRO_AUTOR_CNPJ` é opcional e assume o CNPJ contratante. Para gerar o
   conteúdo de `SERPRO_CERT_PFX_BASE64` localmente:

   ```bash
   base64 -w 0 certificado.pfx
   ```

   No PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes('certificado.pfx'))`.
   Nunca inclua certificado, senha ou credenciais em commits ou mensagens.

## Comportamento

- Selecione uma competência encerrada e clique em **Sincronizar DAS**. O padrão
  é o mês anterior. Cada clique faz uma consulta ao Serpro, que pode ser cobrada.
- O sistema usa `valores.principal` como imposto da competência. Multas e juros
  de reemissão não são lançados automaticamente como tributo daquele mês.
- O custo é gravado em `treinamentos_custos` como variável, único, no último
  dia da competência. Repetir a consulta atualiza o custo da mesma competência.
- O botão emite/consulta os dados de uma guia por competência, mas a emissão
  **não confirma o pagamento**. A data de vencimento não altera a competência.
- Se houver lançamento manual antigo com a descrição genérica **DAS - Simples
  Nacional** e data dentro da competência, ele é reaproveitado. O lançamento
  antigo de agosto/2026 que estava datado em setembro deve ser corrigido antes
  da sincronização para não duplicar o custo.
- Enquanto as credenciais não forem configuradas, o botão informa que a
  integração fiscal está pendente. Não é possível testar a API real sem contrato,
  certificado e acesso fiscal autorizado.

Referências oficiais: [autenticação](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/quick_start/),
[geração de DAS](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/integra-sn/pgdasd/servicos/gerar_das/) e
[serviços e procurações](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/servicos_vs_procuracoes/).

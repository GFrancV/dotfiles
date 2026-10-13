const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, AlignmentType, Footer, PageNumber,
} = require('docx');

const ACCENT = '7A2F8F';
const NOTE_FILL = 'FFF4E0';
const HEAD_FILL = 'EFEDF5';
const CONTENT_WIDTH = 9026;
const SITE_NAME = 'Loja Exemplo';

/** Parse "**bold**" segments into TextRuns. */
const runs = (text, base = {}) =>
  text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith('**')
      ? new TextRun({ ...base, text: part.slice(2, -2), bold: true })
      : new TextRun({ ...base, text: part }));

const p = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 120 }, ...opts.para });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const bullet = (text) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: runs(text), spacing: { after: 80 } });
const numbered = (text) => new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: runs(text), spacing: { after: 100 } });

const note = (text) => new Paragraph({
  children: runs(text),
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: NOTE_FILL },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: 'C77A00', space: 8 } },
  spacing: { before: 160, after: 200 },
  indent: { left: 160, right: 160 },
});

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D0CDDC' };

const table = (widths, header, rows) => new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths: widths,
  rows: [header, ...rows].map((row, rowIndex) => new TableRow({
    tableHeader: rowIndex === 0,
    children: row.map((text, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
      shading: rowIndex === 0 ? { type: ShadingType.CLEAR, color: 'auto', fill: HEAD_FILL } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({ children: runs(text, { bold: rowIndex === 0, size: 19 }) })],
    })),
  })),
});

const spacer = () => new Paragraph({ children: [], spacing: { after: 120 } });

/** Example content from a sample shop. Replace entirely with facts read from the current repo. */
const body = [
  new Paragraph({ children: [new TextRun({ text: 'PARA O DEPARTAMENTO JURÍDICO', bold: true, color: ACCENT, size: 18, characterSpacing: 20 })], spacing: { after: 80 } }),
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(`Inventário de dados pessoais e cookies da loja online ${SITE_NAME}`)] }),
  p('Situação do site a 12 de outubro de 2026 · Elaborado pela equipa de desenvolvimento', { run: { color: '5D5A6E', size: 20 } }),
  p('Este documento descreve que informação o site recolhe, para que a utiliza, com quem a partilha, durante quanto tempo a conserva e que cookies utiliza. Serve de base para a redação da Política de Privacidade e da Política de Cookies. Não é um texto jurídico.'),
  note('**Resumo.** O site recolhe apenas os dados necessários para vender e entregar produtos. Não utiliza ferramentas de estatística (como o Google Analytics), píxeis publicitários, redes sociais nem newsletter. Todos os cookies são técnicos e estritamente necessários. Os pagamentos são processados pela SIBS: o site nunca vê nem guarda os dados do cartão.'),

  h1('1. Que dados são recolhidos e para quê'),

  h2('Conta de cliente'),
  p('Para comprar é necessário ter conta. O cliente pode criá-la ele próprio, na área "A minha conta" ou durante a compra. A equipa da loja também pode criá-la a partir do painel de gestão; nesse caso, o cliente recebe um email para definir a sua palavra-passe.'),
  bullet('**Nome** e **email**: identificar o cliente, iniciar sessão e enviar os emails relativos às encomendas.'),
  bullet('**Palavra-passe**: guardada de forma protegida, de modo que ninguém a consegue ler, nem a equipa da loja.'),
  bullet('**Data de registo** e confirmação do email.'),

  h2('Moradas de envio e faturação'),
  bullet('Nome do destinatário, telefone (opcional), morada, localidade, distrito, código postal e país.'),
  bullet('Finalidade: entregar e faturar a encomenda.'),
  bullet('O cliente decide se guarda a morada na conta para compras futuras. Em qualquer caso, cada encomenda conserva uma cópia das moradas utilizadas.'),

  h2('Encomendas'),
  bullet('Produtos comprados, preços, impostos, portes de envio, desconto ou cupão aplicado e total.'),
  bullet('Método de envio escolhido, transportadora e número de seguimento.'),
  bullet('Histórico de estados da encomenda (pendente, paga, enviada, etc.), com datas.'),
  bullet('Notas que a equipa escreve sobre a encomenda, tanto internas como visíveis para o cliente.'),
  bullet('Finalidade: execução do contrato de compra e venda, apoio ao cliente e cumprimento de obrigações fiscais e contabilísticas.'),

  h2('Pagamentos'),
  bullet('O pagamento é feito através da **SIBS** (cartão, MB WAY ou referência Multibanco). O cliente introduz os dados de pagamento num formulário da SIBS, não da loja.'),
  bullet('A loja guarda: método de pagamento, montante, estado do pagamento, referência Multibanco quando aplicável e o identificador da operação na SIBS. Guarda também a notificação de confirmação enviada pela SIBS.'),
  bullet('A loja **não recebe nem guarda** o número do cartão.'),

  h2('Carrinho e lista de favoritos'),
  bullet('**Carrinho**: produtos adicionados. Um visitante sem sessão iniciada também pode ter carrinho; esse carrinho fica associado à visita de forma anónima.'),
  bullet('**Lista de favoritos**: produtos que o cliente marca como favoritos (apenas com conta).'),

  h2('Dados técnicos da visita'),
  bullet('Enquanto a sessão está aberta, o site guarda o **endereço IP** e o **tipo de navegador e dispositivo**. São usados para manter a sessão e por motivos de segurança.'),
  bullet('O servidor guarda ainda um registo de erros técnicos. Esse registo pode incluir dados da visita em que o erro ocorreu.'),

  h2('Avaliações de produtos (ainda não ativo)'),
  p('O sistema já permite que um cliente avalie um produto que comprou (estrelas, título e texto). A equipa revê cada avaliação antes de a publicar. Esta funcionalidade ainda **não é apresentada no site público**. Se for ativada, será necessário decidir que dado do autor é apresentado (por exemplo, apenas o primeiro nome).'),

  note('**Não é recolhido:** NIF, data de nascimento, género, dados de cartão, localização GPS, dados de redes sociais nem categorias especiais de dados.'),

  h1('2. Emails enviados ao cliente'),
  table([2400, 4626, 2000],
    ['Email', 'Quando é enviado', 'Tipo'],
    [
      ['Conta criada', 'Quando a equipa cria a conta para o cliente', 'Serviço'],
      ['Recuperar palavra-passe', 'Quando o cliente o pede (a ligação expira em 60 minutos)', 'Serviço'],
      ['Alteração do estado da encomenda', 'Pagamento confirmado, envio, entrega, cancelamento, etc. Se um pagamento falhar, inclui uma ligação para tentar novamente', 'Serviço'],
      ['Estado da avaliação', 'Quando a equipa aprova ou rejeita uma avaliação do cliente', 'Serviço'],
      ['**Lembrete de carrinho abandonado**', 'Uma única vez, se um cliente com conta deixar produtos no carrinho mais de 25 horas sem concluir a compra', '**Comercial**'],
    ]),
  note('**Pendente de decisão jurídica:** o lembrete de carrinho abandonado tem caráter comercial. Atualmente é enviado sem consentimento prévio e o email não inclui uma ligação para cancelar a subscrição. É necessário decidir o fundamento de licitude (interesse legítimo com opção de oposição, ou consentimento). Conforme essa decisão, a equipa de desenvolvimento acrescentará a caixa de consentimento ou a ligação de cancelamento.'),

  h1('3. Com quem os dados são partilhados'),
  table([2300, 3600, 3126],
    ['Destinatário', 'O que recebe', 'Para quê'],
    [
      ['**SIBS** (gateway de pagamentos, Portugal)', 'Nome, email, moradas de envio e faturação, montante da encomenda e os dados de pagamento que o cliente introduz no formulário da SIBS', 'Processar o pagamento, prevenção de fraude e verificação de segurança do cartão (3-D Secure)'],
      ['Empresa de alojamento web', 'Todos os dados do site, porque a base de dados está nos seus servidores', 'Alojar a loja. Nome e país do fornecedor: a completar.'],
      ['Fornecedor de envio de emails', 'Nome, email e conteúdo dos emails', 'Enviar os emails do ponto 2. Fornecedor definitivo: a completar.'],
      ['Transportadora', 'Nome, morada e telefone do destinatário', 'Entregar a encomenda. A partilha é feita fora do site, quando a loja prepara o envio.'],
    ]),
  p('Os tipos de letra do site estão alojados no próprio servidor, pelo que a visita não é comunicada à Google. O site não carrega qualquer outro serviço externo.'),

  h1('4. Durante quanto tempo os dados são conservados'),
  table([4200, 4826],
    ['Dado', 'Situação atual'],
    [
      ['Sessão de navegação (inclui IP e navegador)', 'Expira após 2 horas de inatividade'],
      ['Carrinho de um visitante sem conta', 'Apagado automaticamente ao fim de 30 dias'],
      ['Compra iniciada e não concluída', 'Apagada automaticamente ao fim de 7 dias'],
      ['Ligação de recuperação de palavra-passe', 'Expira ao fim de 60 minutos'],
      ['Conta, moradas, lista de favoritos, carrinho do cliente', '**Sem prazo:** conservados enquanto a conta existir'],
      ['Encomendas e pagamentos', '**Sem prazo:** nunca são apagados automaticamente'],
      ['Moradas que o cliente elimina', 'Deixam de ser visíveis para o cliente, mas continuam guardadas'],
      ['Registo de erros do servidor', '**Sem prazo:** não é apagado automaticamente'],
    ]),
  note('**Pendente de decisão jurídica:** indicar o prazo de conservação de cada dado assinalado "sem prazo". Por exemplo: encomendas durante o prazo fiscal obrigatório e contas inativas durante X anos. A equipa de desenvolvimento pode automatizar a eliminação ou anonimização depois de os prazos estarem definidos.'),

  h1('5. O que o cliente pode fazer por si próprio'),
  table([4200, 4826],
    ['Direito', 'Disponível no site?'],
    [
      ['Consultar e corrigir nome, email e palavra-passe', 'Sim, em "A minha conta"'],
      ['Consultar, editar e eliminar moradas', 'Sim'],
      ['Consultar as suas encomendas', 'Sim'],
      ['Apagar a conta', 'Não. Tem de o pedir à loja. Uma conta com encomendas não pode ser simplesmente apagada, porque as encomendas têm de ser conservadas.'],
      ['Obter uma cópia dos seus dados', 'Não. Tem de o pedir à loja.'],
      ['Cancelar os lembretes de carrinho', 'Não (ver ponto 2)'],
    ]),
  p('A política deve indicar um email ou canal de contacto para estes pedidos.'),

  h1('6. Cookies e armazenamento no navegador'),
  p('Todos os cookies do site são **técnicos e estritamente necessários**. Nenhum é usado para estatística, publicidade ou rastreamento. Por isso, enquanto assim for, não é necessário um banner de consentimento: basta informar sobre eles na Política de Cookies.'),
  table([2300, 1500, 3326, 1900],
    ['Nome', 'Próprio / de terceiros', 'Finalidade', 'Duração'],
    [
      ['loja-exemplo-session', 'Próprio', 'Manter a sessão: carrinho, início de sessão e passos da compra', '2 horas desde a última atividade'],
      ['XSRF-TOKEN', 'Próprio', 'Segurança: impede que outro site envie formulários fazendo-se passar pelo utilizador', '2 horas'],
      ['remember_web_…', 'Próprio', 'Manter a sessão iniciada. Só é criado se o cliente assinalar "Lembrar-me" ao iniciar sessão', 'Cerca de 13 meses (400 dias)'],
      ['Cookies da SIBS', 'De terceiros', 'Apenas durante o pagamento, no formulário da SIBS: segurança do pagamento e prevenção de fraude', 'A confirmar com a SIBS'],
    ]),
  p('**Armazenamento local do navegador:** na área "A minha conta" é guardada a preferência do cliente por modo claro ou escuro. Não contém dados pessoais.'),
  note('**Se no futuro forem adicionados** Google Analytics, píxeis da Meta ou do Google Ads, vídeos do YouTube, mapas, chat em direto ou um formulário de newsletter, será necessário atualizar este inventário e, provavelmente, acrescentar um banner de consentimento. A equipa de desenvolvimento avisará antes de adicionar qualquer um deles.'),

  h1('7. Informação necessária do departamento jurídico ou do cliente'),
  numbered('**Responsável pelo tratamento:** denominação social, NIF, sede e email de contacto para questões de privacidade. Indicar também se existe Encarregado da Proteção de Dados (EPD). O rodapé do site ainda mostra telefone e email provisórios.'),
  numbered('**Prazos de conservação** dos dados assinalados "sem prazo" no ponto 4.'),
  numbered('**Fundamento de licitude e opção de cancelamento** do lembrete de carrinho abandonado (ponto 2).'),
  numbered('**Fornecedores:** nome e país da empresa de alojamento e do serviço de email. Se algum estiver fora da UE, indicar as garantias aplicáveis.'),
  numbered('**NIF na fatura:** o site não pede o NIF ao cliente. Confirmar se deve ser pedido (de forma opcional) na compra.'),
  numbered('**Aceitação de condições:** atualmente, nem o registo nem a compra têm uma caixa "Li a Política de Privacidade / aceito os Termos e Condições". Confirmar se deve ser acrescentada.'),
  numbered('**Procedimento** para responder a pedidos de eliminação ou cópia de dados (ponto 5).'),
  numbered('**Avaliações de produtos:** se forem ativadas, que dado do autor é publicado.'),
  spacer(),
  p('A Política de Privacidade e a Política de Devoluções já têm página própria no site (/politica-de-privacidade e /politica-de-devolucoes). A Política de Cookies pode ser incluída na de privacidade ou numa página separada; a equipa de desenvolvimento cria-a quando o texto estiver pronto.', { run: { color: '5D5A6E', size: 20 } }),
];

const doc = new Document({
  creator: 'Equipa de desenvolvimento',
  title: `Inventário de dados pessoais e cookies — ${SITE_NAME}`,
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: 40, bold: true, color: '1D1B26' }, paragraph: { spacing: { after: 120 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: ACCENT }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: '1D1B26' }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${SITE_NAME} · Inventário de dados · Página `, size: 16, color: '5D5A6E' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '5D5A6E' })] })] }),
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(process.argv[2], buffer);
  console.log('written', process.argv[2]);
});
# MiniTube

MiniTube é um pequeno aplicativo de área de trabalho para Windows que abre uma bolinha flutuante e reproduz vídeos incorporáveis do YouTube usando o player oficial. Usa Tauri 2, Rust, React, TypeScript, Vite e WebView2.

## Pré-requisitos

- Windows 11 com Microsoft Edge WebView2 Evergreen.
- Node.js 20.19+ ou 22.12+.
- Rust com o alvo MSVC.
- Microsoft C++ Build Tools.
- NSIS para gerar o instalador.

## Executar

```powershell
npm ci
npm run tauri dev
```

A bolinha abre somente com clique; passar o mouse não troca o modo. Pressione e segure a própria bolinha para arrastá-la. Ela fica sempre no topo, mesmo que o player seja desafixado. Clique nela para abrir o vídeo atual ou a pesquisa. `Ctrl + Alt + Y` abre uma barra de pesquisa transparente junto ao cursor; a lista aparece abaixo depois de pesquisar. A janela permanece aberta até você recolher ou fechá-la.

Cole uma URL segura HTTPS do YouTube/Shorts para assistir sem chave de API. Para pesquisar por texto, crie uma chave da YouTube Data API v3 no Google Cloud Console e salve-a em Configurações. A lista mostra miniatura, título, canal e duração. A chave fica no Gerenciador de Credenciais do Windows; o aplicativo não a grava no repositório nem em texto puro. Chaves usadas em aplicativos distribuídos continuam suscetíveis a uso indevido: restrinja API, cota e projeto.

Selecionar um resultado abre uma janela compacta com o vídeo. Os botões discretos sobre o vídeo permitem pesquisar outro, recolher à bolinha ou abrir os controles completos. A janela expandida tem play/pause, avanço e retorno de 10 segundos, volume, velocidade permitida pelo vídeo, favoritos e abrir no navegador. Recolher reduz a janela à bolinha sem desmontar o iframe, então o áudio continua; use Pause para interromper a reprodução. O histórico mantém até 40 vídeos; favoritos e preferências ficam no armazenamento local do WebView2.

## Preferências e bandeja

A data de publicação aparece nos resultados da API e nos detalhes do vídeo quando disponível. A seta **Voltar aos resultados** restaura a consulta e a posição da lista, permitindo escolher outro vídeo sem pesquisar novamente.

No ícone da bandeja é possível mostrar/ocultar a bolinha, abrir pesquisa e configurações, alternar início com Windows e sair. Fechar a janela recolhe o MiniTube para a bandeja. A opção de inicialização do Windows fica em Configurações. O app inicia em uma janela circular pequena e a opção “Iniciar na bandeja” a esconde após iniciar.

Atalhos: `Ctrl + Alt + Y` para pesquisa global e `Escape` para recolher sem interromper o áudio. Sempre no topo, tema, opacidade e tamanho da bolinha podem ser configurados.

## Build e instalador

```powershell
npm ci
npm test
npm run build
npm run tauri build
```

O instalador NSIS é gerado em `src-tauri/target/release/bundle/nsis/`. O executável fica em `src-tauri/target/release/minitube.exe`.

Para atualizar, escolha **Sair do MiniTube** no menu da bandeja, execute o instalador e abra o app novamente. A instância já aberta mantém a interface da versão anterior até ser encerrada.

## Estrutura

- `src/components`: bolinha, busca, resultados, player, controles e configurações.
- `src/services/youtube.ts`: validação de URLs, pesquisa oficial e mensagens de erro.
- `src/stores`: preferências locais.
- `src-tauri/src`: tray, atalho, instância única, proteção da chave no Credential Manager, identidade do WebView2 e janelas.
- `src/hooks`: visibilidade dos controles do mini-player.

## Limitações conhecidas

O player só funciona para vídeos que permitem incorporação. O YouTube pode bloquear vídeos privados, restritos ou incompatíveis; nesses casos use Abrir no YouTube. Pesquisa textual depende de chave e cota da API oficial. Reprodução, atalho global, bandeja, instalação e autostart devem ser verificados no Windows de destino antes de considerar o app pronto para uso diário. Os testes automatizados usam um player simulado; não comprovam reprodução real, consumo de recursos ou funcionamento em múltiplos monitores.

O mini-player abre em 300 × 202 px e pode ser redimensionado pelo canto até 202 × 202 px, preservando a viewport mínima de 200 × 200 px. Os botões do MiniTube aparecem ao passar o mouse e somem ao sair; os controles internos do YouTube são gerenciados pelo próprio player. Títulos, datas e campo de busca usam fontes maiores e fundos de alto contraste.

## Privacidade

Nenhuma chave de API é distribuída com o código. Preferências, histórico e favoritos são armazenados localmente; a chave configurada fica no Gerenciador de Credenciais do Windows. O player, as miniaturas e a pesquisa fazem conexões com serviços do YouTube/Google. O projeto não importa cookies nem a sessão do seu navegador e não é afiliado ao YouTube ou ao Google.

Arquivos de ambiente, documentos internos, configurações locais de agentes e artefatos compilados são ignorados pelo Git. Não inclua credenciais em issues, capturas ou logs.

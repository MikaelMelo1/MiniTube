<div align="center">
  <img src="src-tauri/icons/icon.png" width="96" height="96" alt="Ícone do MiniTube" />
  <h1>MiniTube</h1>
  <p><strong>Seu vídeo do YouTube em uma janela pequena, flutuante e sempre à mão.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Windows-11-0078D4?logo=windows11&logoColor=white" alt="Windows 11" />
    <img src="https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black" alt="Tauri 2" />
    <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/versão-0.1.0-536DF3" alt="Versão 0.1.0" />
  </p>
  <p>Criado por <a href="https://github.com/MikaelMelo1">Mikael Melo</a></p>
</div>

O MiniTube é um aplicativo para Windows que mantém um vídeo incorporável do YouTube por cima das outras janelas. Recolha o player em uma bolinha, continue trabalhando e volte ao vídeo quando quiser.

## O que você pode fazer

- Abrir a busca com `Ctrl + Alt + Y` e procurar vídeos pelo nome.
- Colar um link do YouTube para reproduzir sem configurar uma chave de API.
- Ver título, canal, miniatura, duração e data de publicação nos resultados, quando disponíveis.
- Recolher o player em uma bolinha sem interromper o áudio; use Pause para parar o vídeo.
- Voltar à lista de resultados e continuar a pesquisa de onde parou.
- Ajustar tamanho e opacidade da bolinha, tema e opção de iniciar com o Windows.
- Controlar reprodução, volume e velocidade, favoritar vídeos e abrir o vídeo no navegador.

O MiniTube aparece somente quando você clica na bolinha. Arraste-a para mudar de posição. A janela permanece sempre no topo e o ícone da bandeja oferece acesso à busca, às configurações e à opção de sair.

Atalhos: `Ctrl + Alt + Y` abre a pesquisa rápida; `Escape` recolhe o player sem interromper o áudio.

## Baixar

O repositório ainda não tem uma versão de instalação publicada na página de Releases. Por enquanto, compile o aplicativo no Windows seguindo as instruções abaixo.

## Executar no Windows

### Requisitos

- Windows 11 com Microsoft Edge WebView2 Evergreen.
- Node.js 20.19+ ou 22.12+.
- Rust com o alvo MSVC e Microsoft C++ Build Tools.
- NSIS para gerar o instalador.

### Modo de desenvolvimento

```powershell
npm ci
npm run tauri dev
```

### Criar o instalador

```powershell
npm ci
npm test
npm run build
npm run tauri build
```

O instalador NSIS aparece em `src-tauri/target/release/bundle/nsis/`; o aplicativo fica em `src-tauri/target/release/minitube.exe`.

## Pesquisa no YouTube

Para buscar pelo nome do vídeo, configure uma chave da **YouTube Data API v3** nas Configurações do MiniTube. A chave é guardada no Gerenciador de Credenciais do Windows. Restrinja o projeto e a cota da chave no Google Cloud Console.

Sem uma chave, você ainda pode colar uma URL HTTPS de vídeo ou Shorts do YouTube. O MiniTube não usa cookies nem a sessão da sua conta no navegador.

## Privacidade e limitações

O histórico, os favoritos e as preferências ficam no armazenamento local do aplicativo. A pesquisa e o player conectam-se aos serviços do YouTube e do Google. Nenhuma chave de API é incluída no código.

O YouTube só permite reproduzir vídeos que aceitam incorporação. Conteúdo privado, restrito ou incompatível pode falhar; nesse caso, abra o vídeo no YouTube. A chave de API é pessoal: não a publique em issues, capturas de tela ou logs.

## Tecnologias

Tauri 2, Rust, React 19, TypeScript, Vite, WebView2, YouTube IFrame Player API e YouTube Data API v3.

## Autoria

MiniTube foi criado e é mantido por **Mikael Melo** — [@MikaelMelo1](https://github.com/MikaelMelo1). O nome também consta nos metadados do instalador e nas Configurações do aplicativo.

O MiniTube é um projeto independente e não é afiliado, patrocinado ou endossado pelo YouTube ou pelo Google.

# Kaizen+ — Rastreador de Hábitos com Gamificação

O **Kaizen+** é um aplicativo mobile-first (disponível para Web e Android Nativo via Capacitor) de monitoramento de hábitos diários com gamificação profunda (pontos, níveis de XP, moedas, streaks de consistência, desafios e medalhas), integrado diretamente ao PostgreSQL via Supabase.

```

## 🏷️ Versão do Projeto

**Versão:** 1.0.0  
**Identificação:** versão disponibilizada para entrega do Trabalho de Curso.

O código-fonte desta versão está disponível no repositório:

[https://github.com/BonfimLucas/kaizen_plus_habit_tracker](https://github.com/BonfimLucas/kaizen_plus_habit_tracker)

## ⚙️ Requisitos e Dependências

Para executar o projeto, são necessários:

- Node.js compatível com a versão utilizada no desenvolvimento;
- npm;
- Git, para clonar o repositório;
- navegador atualizado para execução da aplicação Web.

As dependências do projeto estão declaradas no arquivo `package.json`, enquanto o arquivo `package-lock.json` registra as versões utilizadas na instalação.

## 🔐 Configuração do Ambiente

A aplicação utiliza o Supabase para autenticação e persistência dos dados. Para executar o projeto, é necessário configurar as variáveis de ambiente correspondentes à instância do Supabase.

Crie um arquivo `.env.local` na raiz do projeto, utilizando como referência o arquivo `.env.example`.

Exemplo de configuração:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

Os valores apresentados são ilustrativos. Para utilizar a aplicação com uma instância própria, devem ser informados os dados correspondentes ao projeto Supabase configurado.

**Não devem ser incluídas no repositório credenciais privadas, senhas ou chaves administrativas, como a chave `service_role` do Supabase.**

## ▶️ Execução da Aplicação

Após clonar o repositório e configurar as variáveis de ambiente, execute:

```bash
npm install
npm run dev
```

O servidor de desenvolvimento será iniciado, permitindo acessar a aplicação pelo endereço local informado no terminal.

Para gerar a build de produção e sincronizar os arquivos com o projeto Android:

```bash
npm run build
npx cap sync
```


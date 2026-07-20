# 💕 Site de Namoro

Site privado do casal com cronômetro, galeria de fotos e diário de sentimentos.

---

## 📋 Pré-requisitos

- **XAMPP** ou **WAMP** instalado e rodando
- **MySQL Workbench** (para importar o banco de dados)
- Navegador moderno (Chrome, Firefox, Edge)

---

## ⚙️ Configuração — Passo a Passo

### 1. Copiar arquivos para o XAMPP

Copie toda a pasta `Namoro` para dentro da pasta `htdocs` do XAMPP:

```
C:\xampp\htdocs\Namoro\
```

### 2. Configurar o banco de dados

1. Abra o **MySQL Workbench**
2. Conecte ao servidor local (`localhost`, porta `3306`)
3. Vá em **File → Open SQL Script**
4. Selecione o arquivo `database.sql` desta pasta
5. Execute o script (botão ⚡ ou `Ctrl+Shift+Enter`)

Isso vai criar:
- O banco de dados `namoro_db`
- As tabelas `usuarios`, `fotos`, `sentimentos`, `sessoes`
- **2 contas pré-criadas** (veja abaixo)

### 3. Configurar a conexão PHP

Abra o arquivo `api/config.php` e ajuste:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // seu usuário MySQL
define('DB_PASS', '');          // sua senha MySQL (padrão XAMPP: vazio)
```

### 4. Iniciar o XAMPP

- Abra o **XAMPP Control Panel**
- Inicie os módulos **Apache** e **MySQL**

### 5. Acessar o site

Abra o navegador em:
```
http://localhost/Namoro/
```

---

## 👤 Contas Pré-criadas

| Usuário      | Senha        | Nome         |
|-------------|-------------|---------------|
| `murilo`    | `amor25`     | Murilo        |
| `marialuiza`| `amor25`     | Maria Luiza   |

> ⚠️ **Importante**: Altere os nomes na tabela `usuarios` do MySQL Workbench para os nomes reais de vocês dois!

### Mudar os nomes no banco:
```sql
USE namoro_db;
UPDATE usuarios SET nome = 'Murilo'      WHERE username = 'murilo';
UPDATE usuarios SET nome = 'Maria Luiza' WHERE username = 'marialuiza';
```

### Mudar as senhas:
Para gerar um novo hash bcrypt, execute no PHP (ou use um gerador online):
```php
echo password_hash('sua_nova_senha', PASSWORD_BCRYPT);
```

Depois atualize no banco:
```sql
UPDATE usuarios SET senha_hash = '$2y$...' WHERE username = 'ele';
```

---

## 🗂️ Estrutura de Arquivos

```
Namoro/
├── index.html          # Página principal
├── style.css           # Estilos (tema escuro + rosa)
├── app.js              # Lógica do frontend
├── database.sql        # Script do banco de dados MySQL
├── .htaccess           # Configuração Apache
├── assets/
│   └── bg.png          # Imagem de fundo
├── uploads/            # Fotos enviadas (criada automaticamente)
│   └── .htaccess       # Segurança da pasta
└── api/
    ├── config.php      # Configuração do banco + helpers
    ├── login.php       # Autenticação
    ├── logout.php      # Encerrar sessão
    ├── me.php          # Dados do usuário logado
    ├── fotos.php       # CRUD de fotos
    └── sentimentos.php # CRUD de sentimentos
```

---

## ✨ Funcionalidades

| Seção | Descrição |
|-------|-----------|
| 🔐 **Login** | Acesso com usuário e senha pré-criados |
| ⏱️ **Nosso Tempo** | Cronômetro desde 08/03/2025 (anos, meses, dias, horas, minutos, segundos) |
| 📸 **Fotos** | Upload por clique ou drag & drop, visualização em lightbox, remoção |
| 💌 **Sentimentos** | Escrever e ler mensagens com emojis, histórico do casal |

---

## 🛠️ Personalização

### Mudar a data de início do namoro
Em `app.js`, linha:
```js
const INICIO_NAMORO = new Date('2025-03-08T00:00:00');
```

### Mudar o nome do site
Em `index.html`, altere o título e o nome "Nosso Amor" para o nome que preferir.

---

## 🔒 Segurança

- Senhas armazenadas com **bcrypt** (hash seguro)
- Sessões com token aleatório de 128 bytes
- Upload restrito a imagens (JPEG, PNG, GIF, WebP)
- Tamanho máximo de 10 MB por foto
- Pasta `uploads/` protegida contra execução de PHP

## 🚀 Como Rodar o Site

1. Abra o **XAMPP Control Panel**.
2. Dê **Start** no **Apache** e no **MySQL**.
3. Abra o navegador e acesse: `http://localhost/Namoro/`
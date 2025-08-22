// Script de autenticação para o painel administrativo
document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const signupView = document.getElementById('signup-view');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');

  // Alterna visibilidade entre login e cadastro
  function showLogin() {
    loginView.classList.remove('hidden');
    signupView.classList.add('hidden');
  }
  function showSignup() {
    signupView.classList.remove('hidden');
    loginView.classList.add('hidden');
  }
  if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSignup();
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // Recupera usuários do armazenamento
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (err) {
      console.warn('Erro ao recuperar usuários', err);
      return [];
    }
  }
  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }
  // Armazena usuário logado
  function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Evento de login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const users = getUsers();
      const existing = users.find((u) => u.email === email);
      if (!existing || existing.password !== btoa(password)) {
        alert('Usuário ou senha inválidos');
        return;
      }
      setCurrentUser(existing);
      // Redireciona para o painel
      window.location.href = 'dashboard.html';
    });
  }
  // Evento de cadastro
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const password = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirm').value;
      if (password !== confirm) {
        alert('As senhas não coincidem');
        return;
      }
      let users = getUsers();
      if (users.find((u) => u.email === email)) {
        alert('Usuário já existe');
        return;
      }
      const newUser = { email, password: btoa(password) };
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      window.location.href = 'dashboard.html';
    });
  }

  // Botões de login social (apenas exibição; integração real depende de APIs externas)
  const googleBtn = document.getElementById('googleLogin');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Integração com Google ainda não configurada. Use seu e-mail e senha para acessar.');
    });
  }
  const fbBtn = document.getElementById('facebookLogin');
  if (fbBtn) {
    fbBtn.addEventListener('click', () => {
      alert('Integração com Facebook ainda não configurada. Use seu e-mail e senha para acessar.');
    });
  }
  const appleBtn = document.getElementById('appleLogin');
  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      alert('Integração com Apple ainda não configurada. Use seu e-mail e senha para acessar.');
    });
  }
});
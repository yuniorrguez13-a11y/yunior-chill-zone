/* ═══════════════════════════════════════════════════════════════
   YUNIORS CHILL ZONE — languages
   ───────────────────────────────────────────────────────────────
   TO ADD A LANGUAGE: copy the whole `es:{...}` block, change the
   two-letter code, translate the right-hand side of each line.
   Add it to LANGS below and it appears in the picker. That's it.
   Any key you leave out falls back to English automatically.
   ═══════════════════════════════════════════════════════════════ */

window.YCZ_LANGS = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

/* Languages written right-to-left (Arabic, Hebrew, Farsi, Urdu). */
window.YCZ_RTL = ["ar", "he", "fa", "ur"];

window.YCZ_I18N = {

en: {
  /* navigation */
  dms:"Direct Messages", addServer:"Add a Server", apps:"Apps & Games",
  members:"Members", invite:"Invite people", notifications:"Notifications",
  settings:"Settings", signedOut:"Not signed in", tapSignIn:"tap to sign in",
  textChannels:"Text Channels", voiceChannels:"Voice Channels",
  noChannels:"no channels", signInToSee:"Sign in to see your servers",

  /* auth */
  tagline:"Hang out, talk, play. All in one place.",
  signIn:"Sign In", signUp:"Sign Up", email:"Email", password:"Password",
  displayName:"Display name", createAccount:"Create Account", maybeLater:"Maybe later",
  pwHint:"At least 6 characters", fillBoth:"Fill in both fields.",
  pwShort:"Password needs at least 6 characters.",
  welcomeBack:"Welcome back", checkEmail:"Account created — check your email",

  /* chat */
  message:"Message", forCommands:"for commands", sendTip:"Sign in to chat…",
  noMessages:"No messages yet — say hi", loadOlder:"Load older messages",
  today:"Today", yesterday:"Yesterday", edited:"(edited)",
  reply:"Reply", react:"React", edit:"Edit", delete:"Delete",
  replyingTo:"Replying to", cancel:"Cancel", saveEditHint:"Enter to save · Esc to cancel",
  isTyping:"is typing…", areTyping:"are typing…", peopleTyping:"people are typing…",
  deleteMsg:"Delete this message?", pickEmoji:"Pick one",
  channelStart:"This is the beginning of this channel.",
  dmStart:"This is the start of your conversation.",
  uploadImage:"Upload image", emoji:"Emoji",

  /* servers */
  serverName:"Server name", iconEmoji:"Icon emoji", inviteCode:"Invite code",
  shareThis:"share this", createOwn:"Create my own", joinCode:"Join with code",
  continue:"Continue", copyInvite:"Copy invite code", leaveServer:"Leave server",
  close:"Close", saveChanges:"Save Changes", serverIcon:"Server icon",
  uploadImg:"Upload image", channels:"Channels", newText:"New text channel",
  newVoice:"New voice channel", createChannel:"Create Channel",
  channelName:"Channel name", text:"Text", voice:"Voice", create:"Create",
  channelHint:"Text channels are for chatting. Voice channels are for talking.",
  serverHint:"Make your own space or join a friend's.",
  bots:"Bots", createBot:"Create a bot", noBots:"No bots yet.",
  bannedUsers:"Banned users", nobodyBanned:"Nobody is banned.",
  iconHint:"An uploaded image replaces the emoji.",

  /* voice */
  connecting:"Connecting…", waitingOthers:"Waiting for others…",
  connectedTo:"Connected to", mute:"Mute", unmute:"Unmute",
  disconnect:"Disconnect", enableAudio:"Tap to enable audio",
  micDenied:"Microphone permission denied", needsHttps:"Voice needs https",

  /* profile */
  myProfile:"My Profile", handle:"Handle", uniqueName:"unique @name",
  avatarFrame:"Avatar frame", profileBanner:"Profile banner",
  signOut:"Sign Out", pfpHint:"Tap the circle to change your picture · max 5MB",
  available:"is available", taken:"is taken", saved:"Profile saved",
  addFriend:"Add friend", requestSent:"Request sent", acceptRequest:"Accept request",
  editProfile:"Edit my profile", onlineNow:"Online now", lastSeen:"Last seen",
  member:"Member", admin:"Admin", mod:"Mod", owner:"Owner", bot:"Bot",
  kick:"Kick", ban:"Ban", roleIn:"Role in",
  findPeople:"Find people", searchPeople:"Search @handle or name…",
  nobodyFound:"Nobody found", addFriendsDM:"Add friends to start a DM",
  markAllRead:"Mark all read", nothingYet:"Nothing yet",

  /* landing */
  welcome:"Welcome to Yuniors Chill Zone",
  landingSub:"A free place to hang out with friends — text and voice channels, games, music and more.",
  fServers:"Servers & channels",
  fServersD:"Make your own server with text and voice channels, invite friends with a code, and give people roles.",
  fVoice:"Voice chat", fVoiceD:"Drop into a voice channel and talk. Works across phones and computers.",
  fGames:"Games", fGamesD:"Snake, Doom, Minecraft, Flappy Bird and Subway Surfers, all in the browser.",
  fMusic:"Music room", fMusicD:"Shared playlists, plus a piano you can play with other people at the same time.",
  fVideo:"VideoZone", fVideoD:"Upload and watch videos with the community.",
  fImages:"Qmages", fImagesD:"An image board for saving and sharing pictures onto boards.",
  landingCta:"Free to join — make an account to start chatting.",
  backToChat:"Chill Zone", language:"Language",

  /* features update */
  search:"Search", searchMsgs:"Search messages…", noResults:"No results",
  typeToSearch:"Type at least 2 letters to search this server.",
  pinned:"Pinned messages", pinMsg:"Pin", unpinMsg:"Unpin",
  noPins:"Nothing pinned yet.", msgPinned:"Message pinned", msgUnpinned:"Message unpinned",
  lightMode:"Light mode", darkMode:"Dark mode",
  notifSounds:"Notification sounds", soundsOn:"On", soundsOff:"Off",
  status:"Status", stOnline:"Online", stIdle:"Away", stDnd:"Do not disturb",
  bio:"About me", bioPh:"Tell people a bit about yourself…",
  newMessages:"new messages", jumpLatest:"Jump to latest",
  uploaded:"Uploaded", imageMsg:"image",
},

es: {
  dms:"Mensajes directos", addServer:"Añadir servidor", apps:"Apps y juegos",
  members:"Miembros", invite:"Invitar gente", notifications:"Notificaciones",
  settings:"Ajustes", signedOut:"Sin iniciar sesión", tapSignIn:"toca para entrar",
  textChannels:"Canales de texto", voiceChannels:"Canales de voz",
  noChannels:"sin canales", signInToSee:"Inicia sesión para ver tus servidores",

  tagline:"Habla, juega y pasa el rato. Todo en un sitio.",
  signIn:"Entrar", signUp:"Registrarse", email:"Correo", password:"Contraseña",
  displayName:"Nombre", createAccount:"Crear cuenta", maybeLater:"Ahora no",
  pwHint:"Mínimo 6 caracteres", fillBoth:"Rellena los dos campos.",
  pwShort:"La contraseña necesita al menos 6 caracteres.",
  welcomeBack:"Bienvenido de nuevo", checkEmail:"Cuenta creada — revisa tu correo",

  message:"Mensaje para", forCommands:"para comandos", sendTip:"Inicia sesión para chatear…",
  noMessages:"Aún no hay mensajes — saluda", loadOlder:"Cargar mensajes anteriores",
  today:"Hoy", yesterday:"Ayer", edited:"(editado)",
  reply:"Responder", react:"Reaccionar", edit:"Editar", delete:"Borrar",
  replyingTo:"Respondiendo a", cancel:"Cancelar", saveEditHint:"Enter para guardar · Esc para cancelar",
  isTyping:"está escribiendo…", areTyping:"están escribiendo…", peopleTyping:"personas están escribiendo…",
  deleteMsg:"¿Borrar este mensaje?", pickEmoji:"Elige uno",
  channelStart:"Este es el principio del canal.",
  dmStart:"Este es el principio de vuestra conversación.",
  uploadImage:"Subir imagen", emoji:"Emoji",

  serverName:"Nombre del servidor", iconEmoji:"Emoji del icono", inviteCode:"Código de invitación",
  shareThis:"compártelo", createOwn:"Crear el mío", joinCode:"Unirme con código",
  continue:"Continuar", copyInvite:"Copiar código", leaveServer:"Salir del servidor",
  close:"Cerrar", saveChanges:"Guardar cambios", serverIcon:"Icono del servidor",
  uploadImg:"Subir imagen", channels:"Canales", newText:"Nuevo canal de texto",
  newVoice:"Nuevo canal de voz", createChannel:"Crear canal",
  channelName:"Nombre del canal", text:"Texto", voice:"Voz", create:"Crear",
  channelHint:"Los canales de texto son para escribir. Los de voz, para hablar.",
  serverHint:"Crea tu propio espacio o únete al de un amigo.",
  bots:"Bots", createBot:"Crear un bot", noBots:"Todavía no hay bots.",
  bannedUsers:"Usuarios baneados", nobodyBanned:"No hay nadie baneado.",
  iconHint:"Una imagen subida sustituye al emoji.",

  connecting:"Conectando…", waitingOthers:"Esperando a los demás…",
  connectedTo:"Conectado con", mute:"Silenciar", unmute:"Activar micro",
  disconnect:"Desconectar", enableAudio:"Toca para activar el audio",
  micDenied:"Permiso de micrófono denegado", needsHttps:"La voz necesita https",

  myProfile:"Mi perfil", handle:"Usuario", uniqueName:"@nombre único",
  avatarFrame:"Marco del avatar", profileBanner:"Banner del perfil",
  signOut:"Cerrar sesión", pfpHint:"Toca el círculo para cambiar tu foto · máx 5MB",
  available:"está libre", taken:"ya está cogido", saved:"Perfil guardado",
  addFriend:"Añadir amigo", requestSent:"Solicitud enviada", acceptRequest:"Aceptar solicitud",
  editProfile:"Editar mi perfil", onlineNow:"En línea ahora", lastSeen:"Visto por última vez",
  member:"Miembro", admin:"Admin", mod:"Mod", owner:"Dueño", bot:"Bot",
  kick:"Expulsar", ban:"Banear", roleIn:"Rol en",
  findPeople:"Buscar gente", searchPeople:"Busca @usuario o nombre…",
  nobodyFound:"No se encontró a nadie", addFriendsDM:"Añade amigos para empezar un MD",
  markAllRead:"Marcar todo leído", nothingYet:"Nada por ahora",

  welcome:"Bienvenido a Yuniors Chill Zone",
  landingSub:"Un sitio gratis para pasar el rato con amigos — canales de texto y voz, juegos, música y más.",
  fServers:"Servidores y canales",
  fServersD:"Crea tu servidor con canales de texto y voz, invita amigos con un código y reparte roles.",
  fVoice:"Chat de voz", fVoiceD:"Entra en un canal de voz y habla. Funciona en móvil y ordenador.",
  fGames:"Juegos", fGamesD:"Snake, Doom, Minecraft, Flappy Bird y Subway Surfers, en el navegador.",
  fMusic:"Sala de música", fMusicD:"Playlists compartidas y un piano que podéis tocar a la vez.",
  fVideo:"VideoZone", fVideoD:"Sube y mira vídeos con la comunidad.",
  fImages:"Qmages", fImagesD:"Un tablón de imágenes para guardar y compartir fotos.",
  landingCta:"Gratis — crea una cuenta y empieza a chatear.",
  backToChat:"Chill Zone", language:"Idioma",

  search:"Buscar", searchMsgs:"Buscar mensajes…", noResults:"Sin resultados",
  typeToSearch:"Escribe al menos 2 letras para buscar en este servidor.",
  pinned:"Mensajes fijados", pinMsg:"Fijar", unpinMsg:"Desfijar",
  noPins:"Todavía no hay nada fijado.", msgPinned:"Mensaje fijado", msgUnpinned:"Mensaje desfijado",
  lightMode:"Modo claro", darkMode:"Modo oscuro",
  notifSounds:"Sonidos de notificación", soundsOn:"Activados", soundsOff:"Silenciados",
  status:"Estado", stOnline:"En línea", stIdle:"Ausente", stDnd:"No molestar",
  bio:"Sobre mí", bioPh:"Cuenta algo sobre ti…",
  newMessages:"mensajes nuevos", jumpLatest:"Ir al último",
  uploaded:"Subida", imageMsg:"imagen",
},

fr: {
  dms:"Messages privés", addServer:"Ajouter un serveur", apps:"Applis et jeux",
  members:"Membres", invite:"Inviter", notifications:"Notifications",
  settings:"Paramètres", signedOut:"Non connecté", tapSignIn:"appuie pour te connecter",
  textChannels:"Salons textuels", voiceChannels:"Salons vocaux",
  noChannels:"aucun salon", signInToSee:"Connecte-toi pour voir tes serveurs",

  tagline:"Discute, parle, joue. Tout au même endroit.",
  signIn:"Connexion", signUp:"Inscription", email:"E-mail", password:"Mot de passe",
  displayName:"Nom affiché", createAccount:"Créer un compte", maybeLater:"Plus tard",
  pwHint:"6 caractères minimum", fillBoth:"Remplis les deux champs.",
  pwShort:"Le mot de passe doit faire au moins 6 caractères.",
  welcomeBack:"Content de te revoir", checkEmail:"Compte créé — vérifie tes e-mails",

  message:"Message pour", forCommands:"pour les commandes", sendTip:"Connecte-toi pour discuter…",
  noMessages:"Aucun message — dis bonjour", loadOlder:"Charger les anciens messages",
  today:"Aujourd'hui", yesterday:"Hier", edited:"(modifié)",
  reply:"Répondre", react:"Réagir", edit:"Modifier", delete:"Supprimer",
  replyingTo:"Réponse à", cancel:"Annuler", saveEditHint:"Entrée pour sauvegarder · Échap pour annuler",
  isTyping:"est en train d'écrire…", areTyping:"sont en train d'écrire…", peopleTyping:"personnes écrivent…",
  deleteMsg:"Supprimer ce message ?", pickEmoji:"Choisis-en un",
  channelStart:"C'est le début de ce salon.",
  dmStart:"C'est le début de votre conversation.",
  uploadImage:"Envoyer une image", emoji:"Emoji",

  serverName:"Nom du serveur", iconEmoji:"Emoji de l'icône", inviteCode:"Code d'invitation",
  shareThis:"partage-le", createOwn:"Créer le mien", joinCode:"Rejoindre avec un code",
  continue:"Continuer", copyInvite:"Copier le code", leaveServer:"Quitter le serveur",
  close:"Fermer", saveChanges:"Enregistrer", serverIcon:"Icône du serveur",
  uploadImg:"Envoyer une image", channels:"Salons", newText:"Nouveau salon textuel",
  newVoice:"Nouveau salon vocal", createChannel:"Créer un salon",
  channelName:"Nom du salon", text:"Texte", voice:"Vocal", create:"Créer",
  channelHint:"Les salons textuels servent à écrire. Les vocaux, à parler.",
  serverHint:"Crée ton espace ou rejoins celui d'un ami.",
  bots:"Bots", createBot:"Créer un bot", noBots:"Aucun bot pour l'instant.",
  bannedUsers:"Utilisateurs bannis", nobodyBanned:"Personne n'est banni.",
  iconHint:"Une image remplace l'emoji.",

  connecting:"Connexion…", waitingOthers:"En attente des autres…",
  connectedTo:"Connecté à", mute:"Couper le micro", unmute:"Activer le micro",
  disconnect:"Se déconnecter", enableAudio:"Appuie pour activer le son",
  micDenied:"Permission micro refusée", needsHttps:"Le vocal nécessite https",

  myProfile:"Mon profil", handle:"Identifiant", uniqueName:"@nom unique",
  avatarFrame:"Cadre d'avatar", profileBanner:"Bannière du profil",
  signOut:"Se déconnecter", pfpHint:"Appuie sur le cercle pour changer ta photo · max 5 Mo",
  available:"est libre", taken:"est déjà pris", saved:"Profil enregistré",
  addFriend:"Ajouter en ami", requestSent:"Demande envoyée", acceptRequest:"Accepter la demande",
  editProfile:"Modifier mon profil", onlineNow:"En ligne", lastSeen:"Vu pour la dernière fois",
  member:"Membre", admin:"Admin", mod:"Modo", owner:"Propriétaire", bot:"Bot",
  kick:"Exclure", ban:"Bannir", roleIn:"Rôle dans",
  findPeople:"Trouver des gens", searchPeople:"Cherche un @identifiant ou un nom…",
  nobodyFound:"Personne trouvé", addFriendsDM:"Ajoute des amis pour discuter en privé",
  markAllRead:"Tout marquer comme lu", nothingYet:"Rien pour l'instant",

  welcome:"Bienvenue sur Yuniors Chill Zone",
  landingSub:"Un endroit gratuit pour traîner avec tes amis — salons textuels et vocaux, jeux, musique et plus.",
  fServers:"Serveurs et salons",
  fServersD:"Crée ton serveur avec des salons textuels et vocaux, invite tes amis avec un code et distribue les rôles.",
  fVoice:"Chat vocal", fVoiceD:"Rejoins un salon vocal et parle. Marche sur téléphone et ordinateur.",
  fGames:"Jeux", fGamesD:"Snake, Doom, Minecraft, Flappy Bird et Subway Surfers, dans le navigateur.",
  fMusic:"Salle de musique", fMusicD:"Des playlists partagées et un piano à jouer à plusieurs en même temps.",
  fVideo:"VideoZone", fVideoD:"Envoie et regarde des vidéos avec la communauté.",
  fImages:"Qmages", fImagesD:"Un tableau d'images pour sauvegarder et partager des photos.",
  landingCta:"Gratuit — crée un compte pour commencer à discuter.",
  backToChat:"Chill Zone", language:"Langue",

  search:"Rechercher", searchMsgs:"Rechercher des messages…", noResults:"Aucun résultat",
  typeToSearch:"Tape au moins 2 lettres pour chercher sur ce serveur.",
  pinned:"Messages épinglés", pinMsg:"Épingler", unpinMsg:"Désépingler",
  noPins:"Rien d'épinglé pour l'instant.", msgPinned:"Message épinglé", msgUnpinned:"Message désépinglé",
  lightMode:"Mode clair", darkMode:"Mode sombre",
  notifSounds:"Sons de notification", soundsOn:"Activés", soundsOff:"Coupés",
  status:"Statut", stOnline:"En ligne", stIdle:"Absent", stDnd:"Ne pas déranger",
  bio:"À propos de moi", bioPh:"Raconte un peu qui tu es…",
  newMessages:"nouveaux messages", jumpLatest:"Aller au dernier",
  uploaded:"Envoyée", imageMsg:"image",
},

pt: {
  dms:"Mensagens diretas", addServer:"Adicionar servidor", apps:"Apps e jogos",
  members:"Membros", invite:"Convidar pessoas", notifications:"Notificações",
  settings:"Definições", signedOut:"Sem sessão iniciada", tapSignIn:"toca para entrar",
  textChannels:"Canais de texto", voiceChannels:"Canais de voz",
  noChannels:"sem canais", signInToSee:"Inicia sessão para ver os teus servidores",

  tagline:"Conversa, fala, joga. Tudo num só sítio.",
  signIn:"Entrar", signUp:"Registar", email:"E-mail", password:"Palavra-passe",
  displayName:"Nome", createAccount:"Criar conta", maybeLater:"Agora não",
  pwHint:"Mínimo 6 caracteres", fillBoth:"Preenche os dois campos.",
  pwShort:"A palavra-passe precisa de pelo menos 6 caracteres.",
  welcomeBack:"Bem-vindo de volta", checkEmail:"Conta criada — verifica o teu e-mail",

  message:"Mensagem para", forCommands:"para comandos", sendTip:"Inicia sessão para conversar…",
  noMessages:"Ainda não há mensagens — diz olá", loadOlder:"Carregar mensagens antigas",
  today:"Hoje", yesterday:"Ontem", edited:"(editado)",
  reply:"Responder", react:"Reagir", edit:"Editar", delete:"Apagar",
  replyingTo:"A responder a", cancel:"Cancelar", saveEditHint:"Enter para guardar · Esc para cancelar",
  isTyping:"está a escrever…", areTyping:"estão a escrever…", peopleTyping:"pessoas estão a escrever…",
  deleteMsg:"Apagar esta mensagem?", pickEmoji:"Escolhe um",
  channelStart:"Este é o início deste canal.",
  dmStart:"Este é o início da vossa conversa.",
  uploadImage:"Enviar imagem", emoji:"Emoji",

  serverName:"Nome do servidor", iconEmoji:"Emoji do ícone", inviteCode:"Código de convite",
  shareThis:"partilha-o", createOwn:"Criar o meu", joinCode:"Entrar com código",
  continue:"Continuar", copyInvite:"Copiar código", leaveServer:"Sair do servidor",
  close:"Fechar", saveChanges:"Guardar alterações", serverIcon:"Ícone do servidor",
  uploadImg:"Enviar imagem", channels:"Canais", newText:"Novo canal de texto",
  newVoice:"Novo canal de voz", createChannel:"Criar canal",
  channelName:"Nome do canal", text:"Texto", voice:"Voz", create:"Criar",
  channelHint:"Canais de texto são para escrever. Canais de voz são para falar.",
  serverHint:"Cria o teu espaço ou entra no de um amigo.",
  bots:"Bots", createBot:"Criar um bot", noBots:"Ainda não há bots.",
  bannedUsers:"Utilizadores banidos", nobodyBanned:"Ninguém está banido.",
  iconHint:"Uma imagem enviada substitui o emoji.",

  connecting:"A ligar…", waitingOthers:"À espera dos outros…",
  connectedTo:"Ligado a", mute:"Silenciar", unmute:"Ativar microfone",
  disconnect:"Desligar", enableAudio:"Toca para ativar o áudio",
  micDenied:"Permissão do microfone negada", needsHttps:"A voz precisa de https",

  myProfile:"O meu perfil", handle:"Identificador", uniqueName:"@nome único",
  avatarFrame:"Moldura do avatar", profileBanner:"Banner do perfil",
  signOut:"Terminar sessão", pfpHint:"Toca no círculo para mudar a foto · máx 5MB",
  available:"está livre", taken:"já está ocupado", saved:"Perfil guardado",
  addFriend:"Adicionar amigo", requestSent:"Pedido enviado", acceptRequest:"Aceitar pedido",
  editProfile:"Editar o meu perfil", onlineNow:"Online agora", lastSeen:"Visto pela última vez",
  member:"Membro", admin:"Admin", mod:"Mod", owner:"Dono", bot:"Bot",
  kick:"Expulsar", ban:"Banir", roleIn:"Cargo em",
  findPeople:"Encontrar pessoas", searchPeople:"Procura @identificador ou nome…",
  nobodyFound:"Ninguém encontrado", addFriendsDM:"Adiciona amigos para começar uma MD",
  markAllRead:"Marcar tudo como lido", nothingYet:"Nada ainda",

  welcome:"Bem-vindo ao Yuniors Chill Zone",
  landingSub:"Um sítio grátis para estar com amigos — canais de texto e voz, jogos, música e mais.",
  fServers:"Servidores e canais",
  fServersD:"Cria o teu servidor com canais de texto e voz, convida amigos com um código e dá cargos.",
  fVoice:"Chat de voz", fVoiceD:"Entra num canal de voz e fala. Funciona no telemóvel e no computador.",
  fGames:"Jogos", fGamesD:"Snake, Doom, Minecraft, Flappy Bird e Subway Surfers, no navegador.",
  fMusic:"Sala de música", fMusicD:"Playlists partilhadas e um piano para tocarem ao mesmo tempo.",
  fVideo:"VideoZone", fVideoD:"Envia e vê vídeos com a comunidade.",
  fImages:"Qmages", fImagesD:"Um quadro de imagens para guardar e partilhar fotos.",
  landingCta:"Grátis — cria uma conta e começa a conversar.",
  backToChat:"Chill Zone", language:"Idioma",

  search:"Pesquisar", searchMsgs:"Pesquisar mensagens…", noResults:"Sem resultados",
  typeToSearch:"Escreve pelo menos 2 letras para pesquisar neste servidor.",
  pinned:"Mensagens afixadas", pinMsg:"Afixar", unpinMsg:"Desafixar",
  noPins:"Ainda não há nada afixado.", msgPinned:"Mensagem afixada", msgUnpinned:"Mensagem desafixada",
  lightMode:"Modo claro", darkMode:"Modo escuro",
  notifSounds:"Sons de notificação", soundsOn:"Ligados", soundsOff:"Desligados",
  status:"Estado", stOnline:"Online", stIdle:"Ausente", stDnd:"Não incomodar",
  bio:"Sobre mim", bioPh:"Conta um pouco sobre ti…",
  newMessages:"mensagens novas", jumpLatest:"Ir para a última",
  uploaded:"Enviada", imageMsg:"imagem",
},

};

/* ═══════════════════════════════════════════════════════════════
   ENGINE — no need to touch anything below
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const SAVED = "ycz-lang";

  function pick() {
    const saved = localStorage.getItem(SAVED);
    if (saved && window.YCZ_I18N[saved]) return saved;
    // guess from the browser, e.g. "es-MX" → "es"
    for (const l of navigator.languages || [navigator.language || "en"]) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (window.YCZ_I18N[code]) return code;
    }
    return "en";
  }

  let lang = pick();

  window.t = function (key, fallback) {
    const dict = window.YCZ_I18N[lang] || {};
    return dict[key] ?? window.YCZ_I18N.en[key] ?? fallback ?? key;
  };

  window.yczLang = () => lang;

  window.applyI18n = function (root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = window.t(el.dataset.i18n, el.textContent);
    });
    scope.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = window.t(el.dataset.i18nPh, el.placeholder);
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = window.t(el.dataset.i18nTitle, el.title);
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = window.YCZ_RTL.includes(lang) ? "rtl" : "ltr";
  };

  window.setLang = function (code) {
    if (!window.YCZ_I18N[code]) return;
    lang = code;
    localStorage.setItem(SAVED, code);
    window.applyI18n();
    document.dispatchEvent(new CustomEvent("ycz-lang-changed", { detail: code }));
  };

  /* build a <select> anywhere you drop an element with id="lang-pick" */
  window.mountLangPicker = function (el) {
    const node = el || document.getElementById("lang-pick");
    if (!node) return;
    node.innerHTML = Object.entries(window.YCZ_LANGS)
      .map(([c, n]) => `<option value="${c}">${n}</option>`)
      .join("");
    node.value = lang;
    node.onchange = () => window.setLang(node.value);
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.applyI18n();
    window.mountLangPicker();
  });
})();

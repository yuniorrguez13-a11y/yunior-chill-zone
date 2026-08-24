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

  /* ── gaming zone console ── */
  gz_search:"Search games", gz_fullscreen:"Fullscreen", gz_theme:"Light / dark",
  gz_play:"Play", gz_settings:"Settings", gz_playtime:"Time played",
  gz_records:"Your records", gz_noRecord:"No run yet", gz_proto:"Prototype",
  gz_hBrowse:"Browse", gz_hHold:"Hold for the menu", gz_loading:"Loading",
  gz_resume:"Back to the game", gz_restart:"Restart", gz_exit:"Quit to the console",
  gz_reset:"Clear record and time", gz_done:"Done", gz_cleared:"Cleared",
  gz_zoom:"Zoom", gz_zoomHelp:"For games that draw themselves small in a corner.",
  gz_sharp:"Sharpness", gz_sharpHelp:"Pixelated keeps old art crisp. Smooth softens it.",
  gz_smooth:"Smooth", gz_pixel:"Pixelated",
  gz_mute:"Mute this game", gz_muteHelp:"Works in most games, not every one.",
  gz_autoFs:"Start in fullscreen", gz_autoFsHelp:"Go fullscreen the moment it opens.",
  gz_keys:"Keys", gz_keysHelp:"Play with the keys you want, even when the game won't let you change them.",
  gz_addKey:"Add a key", gz_pressYours:"Press the key YOU want to use…",
  gz_pressGame:"Now press the key the game expects…",
  gz_noKeys:"This one doesn't use the keyboard, so there is nothing to remap.",
  gz_noMaps:"No keys changed — the game's own controls apply.",
  gz_keysExample:"For example: press W, then the Up arrow. Now W moves you up.",
  gz_outside:"This game is hosted elsewhere, so these settings can't reach inside it.",
  gz_hrs:"hrs", gz_min:"min",
  gz_menu:"Menu", gz_back:"Back",
  gz_holdHint:"Hold Esc — or two fingers — for the menu",

  rec_score:"Best score", rec_wave:"Furthest wave", rec_wins:"Matches won",
  g_snake:"Eat, grow, don't bite yourself. The one everybody already knows how to play.",
  g_doom:"Retro shooter rebuilt as plain web pages. Point and click your way through it.",
  g_mc:"Blocky creative mode, running straight in the browser. Nothing to install.",
  g_flappy:"One button. Two pipes. Endless regret.",
  g_subway:"Endless runner. Dodge the trains, keep going.",
  g_suds:"Bullet-hell survival against the dishwasher uprising. Early build — expect rough edges.",
  g_sffg:"Stupidly Funny Fighting Game for Dummies. Two on one keyboard, or online with a room code.",


  /* features update */
  search:"Search", searchMsgs:"Search messages…", noResults:"No results",
  typeToSearch:"Type at least 2 letters to search this server.",
  pinned:"Pinned messages", pinMsg:"Pin", unpinMsg:"Unpin",
  noPins:"Nothing pinned yet.", msgPinned:"Message pinned", msgUnpinned:"Message unpinned",
  lightMode:"Light mode", darkMode:"Dark mode",
  notifSounds:"Notification sounds", soundsOn:"On", soundsOff:"Off",
  pushNotifs:"Push notifications", pushOn:"On — this device gets pinged", pushOff:"Off — tap to enable",
  pushNo:"Not supported in this browser", pushHint:"Pings this device even with the site closed. Works best with the app installed.",
  status:"Status", stOnline:"Online", stIdle:"Away", stDnd:"Do not disturb",
  bio:"About me", bioPh:"Tell people a bit about yourself…",
  newMessages:"new messages", jumpLatest:"Jump to latest",
  uploaded:"Uploaded", imageMsg:"image",

  /* admin tools update */
  auditLog:"Audit log", auditEmpty:"Nothing logged yet.",
  searchMembers:"Search members…", dangerZone:"Danger zone",
  regenInvite:"New code", inviteReset:"Invite code replaced — the old one is dead",
  transferOwner:"Transfer ownership", deleteServer:"Delete server",
  slowmode:"Slowmode", slowOff:"off",
  lockCh:"Lock channel", unlockCh:"Unlock channel",
  chLocked:"This channel is locked — only moderators can post right now.",
  slowNote:"Slowmode — one message every {s}s",
  slowWait:"Slowmode — wait {s}s before sending again",
  mutedNote:"You are timed out here until {t}.",
  timeout:"Timeout", removeTimeout:"Remove timeout", timedOut:"Timed out",
  purgeUser:"Purge msgs", purgeConfirm:"Delete ALL of this user's messages in this server? This cannot be undone.",
  purged:"messages deleted",
  aud_role:"{a} set {t} to {d}",
  aud_kick:"{a} kicked {t}",
  aud_ban:"{a} banned {t}",
  aud_unban:"{a} unbanned {t}",
  aud_timeout:"{a} timed out {t} ({d})",
  aud_untimeout:"{a} removed the timeout on {t}",
  aud_purge:"{a} purged {d} messages from {t}",
  aud_lock:"{a} locked #{t}",
  aud_unlock:"{a} unlocked #{t}",
  aud_slowmode:"{a} set slowmode in #{t} to {d}",
  aud_channel_create:"{a} created channel {t}",
  aud_channel_rename:"{a} renamed channel {d} to {t}",
  aud_channel_delete:"{a} deleted channel {t}",
  aud_invite:"{a} reset the invite code",
  aud_transfer:"{a} transferred ownership to {t}",
  aud_server_update:"{a} edited the server profile",
  aud_bot_create:"{a} created bot {t}",
  aud_bot_delete:"{a} deleted bot {t}",
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

  /* ── consola de la gaming zone ── */
  gz_search:"Buscar juegos", gz_fullscreen:"Pantalla completa", gz_theme:"Claro / oscuro",
  gz_play:"Jugar", gz_settings:"Ajustes", gz_playtime:"Tiempo jugado",
  gz_records:"Tus récords", gz_noRecord:"Aún sin marca", gz_proto:"Prototipo",
  gz_hBrowse:"Moverte", gz_hHold:"Mantén para el menú", gz_loading:"Cargando",
  gz_resume:"Volver al juego", gz_restart:"Reiniciar", gz_exit:"Salir a la consola",
  gz_reset:"Borrar récord y tiempo", gz_done:"Listo", gz_cleared:"Borrado",
  gz_zoom:"Zoom", gz_zoomHelp:"Para los juegos que se dibujan pequeños en una esquina.",
  gz_sharp:"Nitidez", gz_sharpHelp:"Pixelado mantiene el dibujo antiguo limpio. Suavizado lo difumina.",
  gz_smooth:"Suavizado", gz_pixel:"Pixelado",
  gz_mute:"Silenciar este juego", gz_muteHelp:"Funciona en casi todos, no en todos.",
  gz_autoFs:"Arrancar en pantalla completa", gz_autoFsHelp:"Se pone a pantalla completa nada más abrirlo.",
  gz_keys:"Teclas", gz_keysHelp:"Juega con las teclas que quieras, aunque el juego no te deje cambiarlas.",
  gz_addKey:"Añadir tecla", gz_pressYours:"Pulsa la tecla que TÚ quieres usar…",
  gz_pressGame:"Ahora pulsa la que espera el juego…",
  gz_noKeys:"Este no usa el teclado, así que no hay nada que cambiar.",
  gz_noMaps:"Sin cambios — valen los controles del propio juego.",
  gz_keysExample:"Por ejemplo: pulsa W y luego la flecha arriba. Ya subes con W.",
  gz_outside:"Este juego está alojado fuera, así que estos ajustes no le llegan.",
  gz_hrs:"h", gz_min:"min",
  gz_menu:"Menú", gz_back:"Atrás",
  gz_holdHint:"Mantén Esc — o dos dedos — para el menú",

  rec_score:"Mejor puntuación", rec_wave:"Oleada más lejos", rec_wins:"Partidas ganadas",
  g_snake:"Come, crece y no te muerdas. El que ya sabe jugar todo el mundo.",
  g_doom:"Shooter retro rehecho como páginas web. Se juega apuntando y haciendo clic.",
  g_mc:"Modo creativo de bloques, directo en el navegador. Sin instalar nada.",
  g_flappy:"Un botón. Dos tuberías. Arrepentimiento infinito.",
  g_subway:"Corredor sin fin. Esquiva los trenes y sigue.",
  g_suds:"Supervivencia bullet-hell contra el alzamiento de los lavavajillas. Versión temprana — tiene asperezas.",
  g_sffg:"Juego de lucha tontamente divertido para tontos. Dos en un teclado, o en línea con un código de sala.",


  search:"Buscar", searchMsgs:"Buscar mensajes…", noResults:"Sin resultados",
  typeToSearch:"Escribe al menos 2 letras para buscar en este servidor.",
  pinned:"Mensajes fijados", pinMsg:"Fijar", unpinMsg:"Desfijar",
  noPins:"Todavía no hay nada fijado.", msgPinned:"Mensaje fijado", msgUnpinned:"Mensaje desfijado",
  lightMode:"Modo claro", darkMode:"Modo oscuro",
  notifSounds:"Sonidos de notificación", soundsOn:"Activados", soundsOff:"Silenciados",
  pushNotifs:"Notificaciones push", pushOn:"Activadas — este dispositivo recibe avisos", pushOff:"Apagadas — toca para activar",
  pushNo:"No disponible en este navegador", pushHint:"Avisa en este dispositivo aunque el sitio esté cerrado. Funciona mejor con la app instalada.",
  status:"Estado", stOnline:"En línea", stIdle:"Ausente", stDnd:"No molestar",
  bio:"Sobre mí", bioPh:"Cuenta algo sobre ti…",
  newMessages:"mensajes nuevos", jumpLatest:"Ir al último",
  uploaded:"Subida", imageMsg:"imagen",

  /* admin tools update */
  auditLog:"Registro de moderación", auditEmpty:"Aún no hay nada registrado.",
  searchMembers:"Buscar miembros…", dangerZone:"Zona de peligro",
  regenInvite:"Nuevo código", inviteReset:"Código de invitación cambiado — el antiguo ya no vale",
  transferOwner:"Transferir propiedad", deleteServer:"Eliminar servidor",
  slowmode:"Modo lento", slowOff:"apagado",
  lockCh:"Bloquear canal", unlockCh:"Desbloquear canal",
  chLocked:"Este canal está bloqueado — ahora mismo solo pueden escribir los moderadores.",
  slowNote:"Modo lento — un mensaje cada {s}s",
  slowWait:"Modo lento — espera {s}s antes de enviar otro",
  mutedNote:"Estás silenciado aquí hasta las {t}.",
  timeout:"Silenciar", removeTimeout:"Quitar silencio", timedOut:"Silenciado",
  purgeUser:"Purgar msjs", purgeConfirm:"¿Borrar TODOS los mensajes de este usuario en este servidor? No se puede deshacer.",
  purged:"mensajes borrados",
  aud_role:"{a} cambió a {t} a {d}",
  aud_kick:"{a} expulsó a {t}",
  aud_ban:"{a} baneó a {t}",
  aud_unban:"{a} desbaneó a {t}",
  aud_timeout:"{a} silenció a {t} ({d})",
  aud_untimeout:"{a} quitó el silencio a {t}",
  aud_purge:"{a} purgó {d} mensajes de {t}",
  aud_lock:"{a} bloqueó #{t}",
  aud_unlock:"{a} desbloqueó #{t}",
  aud_slowmode:"{a} puso el modo lento de #{t} en {d}",
  aud_channel_create:"{a} creó el canal {t}",
  aud_channel_rename:"{a} renombró el canal {d} a {t}",
  aud_channel_delete:"{a} eliminó el canal {t}",
  aud_invite:"{a} restableció el código de invitación",
  aud_transfer:"{a} transfirió la propiedad a {t}",
  aud_server_update:"{a} editó el perfil del servidor",
  aud_bot_create:"{a} creó el bot {t}",
  aud_bot_delete:"{a} eliminó el bot {t}",
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

  /* ── console de la gaming zone ── */
  gz_search:"Chercher un jeu", gz_fullscreen:"Plein écran", gz_theme:"Clair / sombre",
  gz_play:"Jouer", gz_settings:"Réglages", gz_playtime:"Temps de jeu",
  gz_records:"Tes records", gz_noRecord:"Pas encore joué", gz_proto:"Prototype",
  gz_hBrowse:"Naviguer", gz_hHold:"Maintiens pour le menu", gz_loading:"Chargement",
  gz_resume:"Revenir au jeu", gz_restart:"Recommencer", gz_exit:"Quitter vers la console",
  gz_reset:"Effacer record et temps", gz_done:"Terminé", gz_cleared:"Effacé",
  gz_zoom:"Zoom", gz_zoomHelp:"Pour les jeux qui s'affichent tout petits dans un coin.",
  gz_sharp:"Netteté", gz_sharpHelp:"Pixelisé garde le dessin ancien net. Lissé l'adoucit.",
  gz_smooth:"Lissé", gz_pixel:"Pixelisé",
  gz_mute:"Couper le son du jeu", gz_muteHelp:"Marche dans la plupart des jeux, pas tous.",
  gz_autoFs:"Démarrer en plein écran", gz_autoFsHelp:"Passe en plein écran dès l'ouverture.",
  gz_keys:"Touches", gz_keysHelp:"Joue avec les touches que tu veux, même si le jeu ne le permet pas.",
  gz_addKey:"Ajouter une touche", gz_pressYours:"Appuie sur TA touche…",
  gz_pressGame:"Maintenant celle qu'attend le jeu…",
  gz_noKeys:"Celui-ci n'utilise pas le clavier, il n'y a rien à changer.",
  gz_noMaps:"Aucun changement — les commandes du jeu s'appliquent.",
  gz_keysExample:"Par exemple : appuie sur W, puis sur la flèche haut. W te fait monter.",
  gz_outside:"Ce jeu est hébergé ailleurs, ces réglages ne l'atteignent pas.",
  gz_hrs:"h", gz_min:"min",
  gz_menu:"Menu", gz_back:"Retour",
  gz_holdHint:"Maintiens Échap — ou deux doigts — pour le menu",

  rec_score:"Meilleur score", rec_wave:"Vague la plus loin", rec_wins:"Matchs gagnés",
  g_snake:"Mange, grandis, ne te mords pas. Celui que tout le monde sait déjà jouer.",
  g_doom:"Shooter rétro refait en simples pages web. Ça se joue au clic.",
  g_mc:"Mode créatif en blocs, directement dans le navigateur. Rien à installer.",
  g_flappy:"Un bouton. Deux tuyaux. Des regrets sans fin.",
  g_subway:"Course sans fin. Esquive les trains et continue.",
  g_suds:"Survie bullet-hell contre le soulèvement des lave-vaisselle. Version précoce — ça gratte encore.",
  g_sffg:"Jeu de combat bêtement drôle pour les nuls. À deux sur un clavier, ou en ligne avec un code.",


  search:"Rechercher", searchMsgs:"Rechercher des messages…", noResults:"Aucun résultat",
  typeToSearch:"Tape au moins 2 lettres pour chercher sur ce serveur.",
  pinned:"Messages épinglés", pinMsg:"Épingler", unpinMsg:"Désépingler",
  noPins:"Rien d'épinglé pour l'instant.", msgPinned:"Message épinglé", msgUnpinned:"Message désépinglé",
  lightMode:"Mode clair", darkMode:"Mode sombre",
  notifSounds:"Sons de notification", soundsOn:"Activés", soundsOff:"Coupés",
  pushNotifs:"Notifications push", pushOn:"Activées — cet appareil est prévenu", pushOff:"Désactivées — touchez pour activer",
  pushNo:"Indisponible dans ce navigateur", pushHint:"Prévient cet appareil même quand le site est fermé. Optimal avec l'application installée.",
  status:"Statut", stOnline:"En ligne", stIdle:"Absent", stDnd:"Ne pas déranger",
  bio:"À propos de moi", bioPh:"Raconte un peu qui tu es…",
  newMessages:"nouveaux messages", jumpLatest:"Aller au dernier",
  uploaded:"Envoyée", imageMsg:"image",

  /* admin tools update */
  auditLog:"Journal de modération", auditEmpty:"Rien d'enregistré pour l'instant.",
  searchMembers:"Chercher un membre…", dangerZone:"Zone dangereuse",
  regenInvite:"Nouveau code", inviteReset:"Code d'invitation remplacé — l'ancien ne marche plus",
  transferOwner:"Transférer la propriété", deleteServer:"Supprimer le serveur",
  slowmode:"Mode lent", slowOff:"désactivé",
  lockCh:"Verrouiller le salon", unlockCh:"Déverrouiller le salon",
  chLocked:"Ce salon est verrouillé — seuls les modérateurs peuvent écrire pour le moment.",
  slowNote:"Mode lent — un message toutes les {s}s",
  slowWait:"Mode lent — attends {s}s avant de renvoyer",
  mutedNote:"Tu es exclu temporairement ici jusqu'à {t}.",
  timeout:"Exclure temp.", removeTimeout:"Lever l'exclusion", timedOut:"Exclu temporairement",
  purgeUser:"Purger msgs", purgeConfirm:"Supprimer TOUS les messages de cet utilisateur sur ce serveur ? Irréversible.",
  purged:"messages supprimés",
  aud_role:"{a} a passé {t} en {d}",
  aud_kick:"{a} a expulsé {t}",
  aud_ban:"{a} a banni {t}",
  aud_unban:"{a} a débanni {t}",
  aud_timeout:"{a} a exclu {t} temporairement ({d})",
  aud_untimeout:"{a} a levé l'exclusion de {t}",
  aud_purge:"{a} a purgé {d} messages de {t}",
  aud_lock:"{a} a verrouillé #{t}",
  aud_unlock:"{a} a déverrouillé #{t}",
  aud_slowmode:"{a} a réglé le mode lent de #{t} sur {d}",
  aud_channel_create:"{a} a créé le salon {t}",
  aud_channel_rename:"{a} a renommé le salon {d} en {t}",
  aud_channel_delete:"{a} a supprimé le salon {t}",
  aud_invite:"{a} a réinitialisé le code d'invitation",
  aud_transfer:"{a} a transféré la propriété à {t}",
  aud_server_update:"{a} a modifié le profil du serveur",
  aud_bot_create:"{a} a créé le bot {t}",
  aud_bot_delete:"{a} a supprimé le bot {t}",
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

  /* ── consola da gaming zone ── */
  gz_search:"Procurar jogos", gz_fullscreen:"Ecrã inteiro", gz_theme:"Claro / escuro",
  gz_play:"Jogar", gz_settings:"Definições", gz_playtime:"Tempo jogado",
  gz_records:"Os teus recordes", gz_noRecord:"Ainda sem marca", gz_proto:"Protótipo",
  gz_hBrowse:"Navegar", gz_hHold:"Mantém para o menu", gz_loading:"A carregar",
  gz_resume:"Voltar ao jogo", gz_restart:"Recomeçar", gz_exit:"Sair para a consola",
  gz_reset:"Apagar recorde e tempo", gz_done:"Pronto", gz_cleared:"Apagado",
  gz_zoom:"Zoom", gz_zoomHelp:"Para os jogos que se desenham pequenos num canto.",
  gz_sharp:"Nitidez", gz_sharpHelp:"Pixelado mantém o desenho antigo limpo. Suavizado esbate-o.",
  gz_smooth:"Suavizado", gz_pixel:"Pixelado",
  gz_mute:"Silenciar este jogo", gz_muteHelp:"Funciona na maioria dos jogos, não em todos.",
  gz_autoFs:"Arrancar em ecrã inteiro", gz_autoFsHelp:"Fica em ecrã inteiro assim que abre.",
  gz_keys:"Teclas", gz_keysHelp:"Joga com as teclas que quiseres, mesmo que o jogo não deixe mudar.",
  gz_addKey:"Adicionar tecla", gz_pressYours:"Carrega na tecla que TU queres usar…",
  gz_pressGame:"Agora na que o jogo espera…",
  gz_noKeys:"Este não usa o teclado, por isso não há nada para mudar.",
  gz_noMaps:"Sem alterações — valem os controlos do próprio jogo.",
  gz_keysExample:"Por exemplo: carrega em W e depois na seta para cima. Já sobes com W.",
  gz_outside:"Este jogo está alojado fora, por isso estas definições não lhe chegam.",
  gz_hrs:"h", gz_min:"min",
  gz_menu:"Menu", gz_back:"Voltar",
  gz_holdHint:"Mantém Esc — ou dois dedos — para o menu",

  rec_score:"Melhor pontuação", rec_wave:"Onda mais longe", rec_wins:"Partidas ganhas",
  g_snake:"Come, cresce e não te mordas. Aquele que toda a gente já sabe jogar.",
  g_doom:"Shooter retro refeito como páginas web simples. Joga-se a apontar e clicar.",
  g_mc:"Modo criativo de blocos, direto no navegador. Sem instalar nada.",
  g_flappy:"Um botão. Dois canos. Arrependimento sem fim.",
  g_subway:"Corrida sem fim. Desvia-te dos comboios e continua.",
  g_suds:"Sobrevivência bullet-hell contra o levantamento das máquinas de lavar. Versão inicial — tem arestas.",
  g_sffg:"Jogo de luta estupidamente divertido para totós. Dois num teclado, ou online com um código de sala.",


  search:"Pesquisar", searchMsgs:"Pesquisar mensagens…", noResults:"Sem resultados",
  typeToSearch:"Escreve pelo menos 2 letras para pesquisar neste servidor.",
  pinned:"Mensagens afixadas", pinMsg:"Afixar", unpinMsg:"Desafixar",
  noPins:"Ainda não há nada afixado.", msgPinned:"Mensagem afixada", msgUnpinned:"Mensagem desafixada",
  lightMode:"Modo claro", darkMode:"Modo escuro",
  notifSounds:"Sons de notificação", soundsOn:"Ligados", soundsOff:"Desligados",
  pushNotifs:"Notificações push", pushOn:"Ativadas — este aparelho recebe avisos", pushOff:"Desativadas — toque para ativar",
  pushNo:"Indisponível neste navegador", pushHint:"Avisa neste aparelho mesmo com o site fechado. Melhor com o app instalado.",
  status:"Estado", stOnline:"Online", stIdle:"Ausente", stDnd:"Não incomodar",
  bio:"Sobre mim", bioPh:"Conta um pouco sobre ti…",
  newMessages:"mensagens novas", jumpLatest:"Ir para a última",
  uploaded:"Enviada", imageMsg:"imagem",

  /* admin tools update */
  auditLog:"Registro de moderação", auditEmpty:"Nada registrado ainda.",
  searchMembers:"Buscar membros…", dangerZone:"Zona de perigo",
  regenInvite:"Novo código", inviteReset:"Código de convite trocado — o antigo já não vale",
  transferOwner:"Transferir a posse", deleteServer:"Excluir servidor",
  slowmode:"Modo lento", slowOff:"desligado",
  lockCh:"Bloquear canal", unlockCh:"Desbloquear canal",
  chLocked:"Este canal está bloqueado — só moderadores podem escrever agora.",
  slowNote:"Modo lento — uma mensagem a cada {s}s",
  slowWait:"Modo lento — espere {s}s para enviar de novo",
  mutedNote:"Você está de castigo aqui até {t}.",
  timeout:"Castigo", removeTimeout:"Tirar castigo", timedOut:"De castigo",
  purgeUser:"Limpar msgs", purgeConfirm:"Apagar TODAS as mensagens deste usuário neste servidor? Não dá para desfazer.",
  purged:"mensagens apagadas",
  aud_role:"{a} mudou {t} para {d}",
  aud_kick:"{a} expulsou {t}",
  aud_ban:"{a} baniu {t}",
  aud_unban:"{a} desbaniu {t}",
  aud_timeout:"{a} colocou {t} de castigo ({d})",
  aud_untimeout:"{a} tirou o castigo de {t}",
  aud_purge:"{a} limpou {d} mensagens de {t}",
  aud_lock:"{a} bloqueou #{t}",
  aud_unlock:"{a} desbloqueou #{t}",
  aud_slowmode:"{a} definiu o modo lento de #{t} para {d}",
  aud_channel_create:"{a} criou o canal {t}",
  aud_channel_rename:"{a} renomeou o canal {d} para {t}",
  aud_channel_delete:"{a} excluiu o canal {t}",
  aud_invite:"{a} redefiniu o código de convite",
  aud_transfer:"{a} transferiu a posse para {t}",
  aud_server_update:"{a} editou o perfil do servidor",
  aud_bot_create:"{a} criou o bot {t}",
  aud_bot_delete:"{a} excluiu o bot {t}",
},

};

/* ═══════════════════════════════════════════════════════════════
   ENGINE — no need to touch anything below
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const SAVED = "ycz-lang";

  /* Storage isn't guaranteed: a page embedded in an iframe can have it
     denied outright, and that used to throw right here — taking the whole
     translation engine down with it, on every page. */
  function saved_() {
    try { return localStorage.getItem(SAVED); } catch (e) { return null; }
  }

  function pick() {
    const saved = saved_();
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
    try { localStorage.setItem(SAVED, code); } catch (e) {}
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

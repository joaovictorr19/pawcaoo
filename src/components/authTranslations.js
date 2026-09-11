// Auth pages translations (Login, Register, ForgotPassword, ResetPassword)
// Standalone module so auth pages respect the selected language without
// bloating the main translations.jsx (which is at its size limit).
export const authTranslations = {
  login: { pt: 'Entrar', en: 'Sign In', es: 'Iniciar Sesión', fr: 'Connexion' },
  signIn: { pt: 'Entrar', en: 'Sign In', es: 'Iniciar Sesión', fr: 'Se connecter' },
  welcomeBack: { pt: 'Bem-vindo de volta à PawCão', en: 'Welcome back to PawCão', es: 'Bienvenido de nuevo a PawCão', fr: 'Bon retour sur PawCão' },
  createAccountTitle: { pt: 'Criar Conta', en: 'Create Account', es: 'Crear Cuenta', fr: 'Créer un compte' },
  verifyEmail: { pt: 'Verificar Email', en: 'Verify Email', es: 'Verificar Correo', fr: "Vérifier l'email" },
  joinCommunity: { pt: 'Junte-se à comunidade PawCão', en: 'Join the PawCão community', es: 'Únete a la comunidad PawCão', fr: 'Rejoignez la communauté PawCão' },
  insertCode: { pt: 'Insira o código enviado para {email}', en: 'Enter the code sent to {email}', es: 'Introduce el código enviado a {email}', fr: 'Saisissez le code envoyé à {email}' },
  continueWithGoogle: { pt: 'Continuar com Google', en: 'Continue with Google', es: 'Continuar con Google', fr: 'Continuer avec Google' },
  continueWithApple: { pt: 'Continuar com Apple', en: 'Continue with Apple', es: 'Continuar con Apple', fr: 'Continuer avec Apple' },
  or: { pt: 'ou', en: 'or', es: 'o', fr: 'ou' },
  email: { pt: 'Email', en: 'Email', es: 'Correo', fr: 'E-mail' },
  password: { pt: 'Senha', en: 'Password', es: 'Contraseña', fr: 'Mot de passe' },
  confirmPassword: { pt: 'Confirmar Senha', en: 'Confirm Password', es: 'Confirmar Contraseña', fr: 'Confirmer le mot de passe' },
  forgotPassword: { pt: 'Esqueceu a senha?', en: 'Forgot password?', es: '¿Olvidaste la contraseña?', fr: 'Mot de passe oublié ?' },
  noAccount: { pt: 'Não tem conta?', en: "Don't have an account?", es: '¿No tienes cuenta?', fr: 'Pas de compte ?' },
  haveAccount: { pt: 'Já tem conta?', en: 'Already have an account?', es: '¿Ya tienes cuenta?', fr: 'Vous avez déjà un compte ?' },
  createAccount: { pt: 'Criar conta', en: 'Create account', es: 'Crear cuenta', fr: 'Créer un compte' },
  verify: { pt: 'Verificar', en: 'Verify', es: 'Verificar', fr: 'Vérifier' },
  resendCode: { pt: 'Reenviar código', en: 'Resend code', es: 'Reenviar código', fr: 'Renvoyer le code' },
  sendLink: { pt: 'Enviar Link', en: 'Send Link', es: 'Enviar Enlace', fr: 'Envoyer le lien' },
  resetPasswordBtn: { pt: 'Resetar Senha', en: 'Reset Password', es: 'Restablecer Contraseña', fr: 'Réinitialiser le mot de passe' },
  passwordsDontMatch: { pt: 'As senhas não coincidem', en: 'Passwords do not match', es: 'Las contraseñas no coinciden', fr: 'Les mots de passe ne correspondent pas' },
  codeSent: { pt: 'Código enviado para o seu email!', en: 'Code sent to your email!', es: '¡Código enviado a tu correo!', fr: 'Code envoyé à votre email !' },
  accountVerified: { pt: 'Conta verificada! A redirecionar...', en: 'Account verified! Redirecting...', es: '¡Cuenta verificada! Redirigiendo...', fr: 'Compte vérifié ! Redirection...' },
  codeResent: { pt: 'Código reenviado!', en: 'Code resent!', es: '¡Código reenviado!', fr: 'Code renvoyé !' },
  resendError: { pt: 'Erro ao reenviar código', en: 'Error resending code', es: 'Error al reenviar el código', fr: 'Erreur lors du renvoi du code' },
  recoverySent: { pt: 'Email de recuperação enviado', en: 'Recovery email sent', es: 'Correo de recuperación enviado', fr: 'Email de récupération envoyé' },
  recoveryGeneric: { pt: 'Se a conta existir, receberá um link para resetar sua senha', en: 'If the account exists, you will receive a link to reset your password', es: 'Si la cuenta existe, recibirás un enlace para restablecer tu contraseña', fr: 'Si le compte existe, vous recevrez un lien pour réinitialiser votre mot de passe' },
  checkEmail: { pt: 'Verifique seu Email', en: 'Check your Email', es: 'Revisa tu Correo', fr: 'Vérifiez votre email' },
  recoverPassword: { pt: 'Recuperar Senha', en: 'Recover Password', es: 'Recuperar Contraseña', fr: 'Récupérer le mot de passe' },
  enterEmailToRecover: { pt: 'Insira seu email para receber um link de recuperação', en: 'Enter your email to receive a recovery link', es: 'Introduce tu correo para recibir un enlace de recuperación', fr: 'Saisissez votre email pour recevoir un lien de récupération' },
  linkSentTo: { pt: 'Um link de recuperação foi enviado para {email}', en: 'A recovery link was sent to {email}', es: 'Se envió un enlace de recuperación a {email}', fr: 'Un lien de récupération a été envoyé à {email}' },
  backToLogin: { pt: 'Voltar ao Login', en: 'Back to Login', es: 'Volver al Inicio de Sesión', fr: 'Retour à la connexion' },
  newPassword: { pt: 'Nova Senha', en: 'New Password', es: 'Nueva Contraseña', fr: 'Nouveau mot de passe' },
  setNewPassword: { pt: 'Defina uma nova senha para sua conta', en: 'Set a new password for your account', es: 'Establece una nueva contraseña para tu cuenta', fr: 'Définissez un nouveau mot de passe pour votre compte' },
  passwordChanged: { pt: 'Senha alterada com sucesso!', en: 'Password changed successfully!', es: '¡Contraseña cambiada con éxito!', fr: 'Mot de passe modifié avec succès !' },
  redirectingToLogin: { pt: 'Será redirecionado para login em breve...', en: 'You will be redirected to login shortly...', es: 'Serás redirigido al inicio de sesión en breve...', fr: 'Vous serez redirigé vers la connexion sous peu...' },
  invalidToken: { pt: 'Token inválido ou expirado', en: 'Invalid or expired token', es: 'Token inválido o expirado', fr: 'Jeton invalide ou expiré' },
  passwordResetError: { pt: 'Erro ao resetar senha', en: 'Error resetting password', es: 'Error al restablecer la contraseña', fr: 'Erreur lors de la réinitialisation du mot de passe' },
  recoveryInvalid: { pt: 'Link de recuperação inválido ou expirado', en: 'Invalid or expired recovery link', es: 'Enlace de recuperación inválido o expirado', fr: 'Lien de récupération invalide ou expiré' },
  requestNewLink: { pt: 'Solicitar novo link', en: 'Request new link', es: 'Solicitar nuevo enlace', fr: 'Demander un nouveau lien' },
  invalidLogin: { pt: 'Email ou senha inválidos', en: 'Invalid email or password', es: 'Correo o contraseña inválidos', fr: 'Email ou mot de passe invalide' },
  errorCreatingAccount: { pt: 'Erro ao criar conta', en: 'Error creating account', es: 'Error al crear la cuenta', fr: 'Erreur lors de la création du compte' },
  invalidCode: { pt: 'Código inválido', en: 'Invalid code', es: 'Código inválido', fr: 'Code invalide' },
  otpLabel: { pt: 'Código de Verificação', en: 'Verification Code', es: 'Código de Verificación', fr: 'Code de vérification' },
};

const fallbackChain = {
  pt: ['pt', 'en'],
  en: ['en', 'pt'],
  es: ['es', 'pt', 'en'],
  fr: ['fr', 'en', 'pt'],
};

// Resolve an auth translation key for the given language.
// Supports a {placeholder} substitution via the optional `vars` map.
export const ta = (key, lang = 'pt', vars) => {
  const langs = fallbackChain[lang] || ['en', 'pt'];
  let value = key;
  for (const l of langs) {
    if (authTranslations[key]?.[l]) {
      value = authTranslations[key][l];
      break;
    }
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return value;
};
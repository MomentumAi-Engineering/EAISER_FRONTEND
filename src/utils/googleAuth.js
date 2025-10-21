export const initGoogleAuth = () => {
  return new Promise((resolve) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/gapi.js';
    script.onload = () => {
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        }).then(() => {
          resolve();
        });
      });
    };
    document.body.appendChild(script);
  });
};

export const signInWithGoogle = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await initGoogleAuth();
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      const profile = user.getBasicProfile();
      const userData = {
        email: profile.getEmail(),
        name: profile.getName(),
        googleId: profile.getId(),
        picture: profile.getImageUrl()
      };
      
      resolve(userData);
    } catch (error) {
      reject(error);
    }
  });
};

export const signInWithGooglePopup = () => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = 'postmessage';
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=select_account`;

    const popup = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Popup was closed by user'));
      }
    }, 1000);

    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://accounts.google.com') return;
      
      clearInterval(checkClosed);
      popup.close();
      
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    });
  });
};

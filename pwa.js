(() => {
  let deferredInstall = null;
  let offlineReady = location.protocol === 'file:' || !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  let offlineFailed = false;
  const setStatus = () => {
    let bar = document.getElementById('offlineStatus');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offlineStatus';
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');
      bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:40;padding:8px 11px;border-radius:999px;font:12px Tahoma,Arial;background:#eaf9f5;color:#087f67;transition:.2s';
      document.body.appendChild(bar);
    }
    if (navigator.onLine) {
      bar.textContent = offlineReady ? 'متصل • المحتوى جاهز للتعلّم دون إنترنت' : offlineFailed ? 'تعذّر تجهيز ملفات دون إنترنت • أعد تحميل الصفحة مع الاتصال' : 'متصل • جارٍ تجهيز ملفات التعلّم دون إنترنت';
      bar.style.background = offlineReady ? '#eaf9f5' : offlineFailed ? '#fff0ed' : '#eef4ff';
      bar.style.color = offlineReady ? '#087f67' : offlineFailed ? '#9b3d2c' : '#315b9e';
    } else {
      bar.textContent = offlineReady ? 'أنت دون اتصال • تعلّمك محفوظ على هذا الجهاز' : 'غير متصل • لم يكتمل تنزيل المنصة؛ اتصل بالإنترنت أولًا';
      bar.style.background = offlineReady ? '#eaf9f5' : '#fff0ed';
      bar.style.color = offlineReady ? '#087f67' : '#9b3d2c';
    }
  };
  const showInstall = () => {
    const button = document.getElementById('installApp');
    if (!button) return;
    button.classList.toggle('hide', !deferredInstall);
    button.onclick = async () => {
      if (!deferredInstall) return;
      const prompt = deferredInstall;
      deferredInstall = null;
      await prompt.prompt();
      await prompt.userChoice;
      button.classList.add('hide');
    };
  };
  const watchWorker = worker => {
    if (!worker) return;
    const update = () => {
      if (worker.state === 'activated') {
        offlineReady = true;
        offlineFailed = false;
        setStatus();
      } else if (worker.state === 'redundant' && !navigator.serviceWorker.controller) {
        offlineReady = false;
        offlineFailed = true;
        setStatus();
      }
    };
    worker.addEventListener('statechange', update);
    update();
  };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
    showInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    showInstall();
  });
  window.addEventListener('online', setStatus);
  window.addEventListener('offline', setStatus);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      offlineReady = true;
      offlineFailed = false;
      setStatus();
    });
  }
  setStatus();
  window.addEventListener('load', async () => {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      offlineReady = !!(registration.active || navigator.serviceWorker.controller);
      offlineFailed = false;
      setStatus();
      watchWorker(registration.installing);
      registration.addEventListener('updatefound', () => watchWorker(registration.installing));
    } catch (error) {
      offlineReady = false;
      offlineFailed = true;
      setStatus();
      console.warn('Offline support could not start:', error);
    }
  });
})();

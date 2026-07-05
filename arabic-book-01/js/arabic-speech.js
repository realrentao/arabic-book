/* ===================================================
   العربية بين يديك - Arabic Speech System (edge-tts only)
   纯 MP3 播放，完全基于预生成 edge-tts 音频
   无 Web Speech API / speechSynthesis 依赖
   =================================================== */

(function () {
  'use strict';

  // ===== 音频映射表 (ar text → MP3 filename) =====
  const AUDIO_BASE = 'audio/';
  const audioMap = {
    // 问候语
    'السَّلَامُ عَلَيْكُمْ':       'greeting.mp3',
    'السَّلَامُ عَلَيْكُم':        'greeting.mp3',
    'وَعَلَيْكُمُ السَّلَامُ':     'greeting-reply.mp3',
    'كَيْفَ حَالُكَ':              'how-are-you-m.mp3',
    'كَيْفَ حَالُكِ':              'how-are-you-f.mp3',
    'بِخَيْرٍ':                    'fine.mp3',
    'الْحَمْدُ لِلَّهِ':           'alhamdulillah.mp3',
    'أَهْلًا وَسَهْلًا':          'ahlan-wa-sahlan.mp3',
    'شُكْرًا':                    'shukran.mp3',
    'مَعَ السَّلَامَةِ':          'ma-assalama.mp3',

    // 人称与介绍
    'أَنَا':       'ana.mp3',
    'أَنْتَ':      'anta.mp3',
    'أَنْتِ':      'anti.mp3',
    'هُوَ':        'huwa.mp3',
    'هِيَ':        'hiya.mp3',
    'اسْمِي':     'ismi.mp3',
    'مَا اسْمُكَ': 'ma-ismuka.mp3',
    'مَا اسْمُكِ': 'ma-ismuki.mp3',
    'مِنْ أَيْنَ أَنْتَ':  'min-ayna-anta.mp3',
    'مِنْ أَيْنِ أَنْتِ':  'min-ayni-anti.mp3',
    'أَنَا مِنْ':         'ana-min.mp3',

    // 国籍
    'مِصْرِيٌّ':         'misri.mp3',
    'مِصْرِيَّةٌ':       'misriyya.mp3',
    'سُورِيٌّ':          'suri.mp3',
    'سُورِيَّةٌ':        'suriyya.mp3',
    'تُرْكِيٌّ':         'turki.mp3',
    'تُرْكِيَّةٌ':       'turkiyya.mp3',
    'بَاكِسْتَانِيٌّ':   'bakistani.mp3',
    'بَاكِسْتَانِيَّةٌ': 'bakistaniyya.mp3',

    // 职业
    'طَالِبٌ':     'talib.mp3',
    'طَالِبَةٌ':   'taliba.mp3',
    'مُدَرِّسٌ':   'mudarris.mp3',
    'مُدَرِّسَةٌ': 'mudarrisa.mp3',
    'طَبِيبٌ':     'tabib.mp3',
    'طَبِيبَةٌ':   'tabiba.mp3',
    'مُهَنْدِسٌ':  'muhandis.mp3',
    'مُهَنْدِسَةٌ':'muhandisa.mp3',
    'صَدِيقٌ':     'sadiq.mp3',
    'صَدِيقَةٌ':   'sadiqa.mp3',

    // 指示代词 + 疑问词 + 基础词汇
    'هَذَا':  'hadha.mp3',
    'هَذِهِ': 'hadhihi.mp3',
    'هَلْ':   'hal.mp3',
    'مَا':    'ma.mp3',
    'مَنْ':   'man.mp3',
    'نَعَم':  'naam.mp3',
    'لَا':    'la.mp3',

    // 数字 1-6
    'وَاحِدٌ':   'wahid.mp3',
    'اِثْنَانِ': 'ithnan.mp3',
    'ثَلَاثَةٌ': 'thalatha.mp3',
    'أَرْبَعَةٌ':'arbaa.mp3',
    'خَمْسَةٌ':  'khamsa.mp3',
    'سِتَّةٌ':   'sitta.mp3',

    // 短句
    'اسْمِي خَوْلَةُ. مَا اسْمُكِ':     'sentence-ismi-khawla.mp3',
    'هَلْ أَنْتِ مِصْرِيَّةٌ':         'sentence-hal-anti-misriyya.mp3',
    'أَنَا سُورِيَّةٌ. أَنَا مِنْ سُورِيَا': 'sentence-ana-suriyya.mp3',
    'هَذَا طَالِبٌ':                   'sentence-hadha-talib.mp3',
    'هَذِهِ طَالِبَةٌ':                'sentence-hadhihi-taliba.mp3',
    'هَلْ أَنْتَ طَالِبٌ':             'sentence-hal-anta-talib.mp3',
    'مَنْ هَذَا':                      'sentence-man-hadha.mp3',
    'هَلْ أَنْتَ بَاكِسْتَانِيٌّ':     'sentence-hal-anta-bakistani.mp3',
    'أَهْلًا بِكَ':                    'sentence-ahlan-bika.mp3',

    // 古兰经经文
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ': 'sentence-bismillah.mp3',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ':   'sentence-alhamdu.mp3',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ': 'sentence-iyyaka.mp3',
  };

  // ===== 状态 =====
  let currentAudio = null;  // 当前正在播放的 Audio 对象
  let isPlaying = false;
  let activeEl = null;      // 当前高亮的元素

  // ===== 查找音频路径 =====
  function findAudio(text) {
    if (!text) return null;
    // 标准化：移除标点
    let key = text.replace(/[؟\?\.،,;:\-!]/g, '').trim();
    // 精确匹配
    if (audioMap[key]) return AUDIO_BASE + audioMap[key];
    // 去掉变音符号后匹配
    let clean = key.replace(/[ًٌٍَُِّْٰٖٗٓٔ]/g, '');
    if (audioMap[clean]) return AUDIO_BASE + audioMap[clean];
    // 前缀/后缀匹配
    for (const k of Object.keys(audioMap)) {
      if (key.startsWith(k) || k.startsWith(key))
        return AUDIO_BASE + audioMap[k];
    }
    return null;
  }

  // ===== 播放音频 =====
  function playArabic(text, el) {
    if (!text || !text.trim()) return;
    // 如果正在播放则先停止
    stopPlayback();

    const path = findAudio(text);
    if (!path) {
      console.warn('[arabic-speech] 未找到音频映射: "' + text.substring(0, 20) + '"');
      return;
    }

    const audio = new Audio(path);
    audio.preload = 'auto';

    // 高亮当前元素
    activeEl = el || null;
    highlightEl(activeEl);

    audio.onplay = function () {
      isPlaying = true;
    };
    audio.onended = function () {
      isPlaying = false;
      unhighlightEl(activeEl);
      activeEl = null;
      currentAudio = null;
    };
    audio.onerror = function () {
      console.warn('[arabic-speech] 音频加载失败: ' + path);
      isPlaying = false;
      unhighlightEl(activeEl);
      activeEl = null;
      currentAudio = null;
    };

    currentAudio = audio;
    audio.play().catch(function (err) {
      console.warn('[arabic-speech] 播放失败:', err);
      isPlaying = false;
      unhighlightEl(activeEl);
      activeEl = null;
      currentAudio = null;
    });
  }

  // ===== 停止播放 =====
  function stopPlayback() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    isPlaying = false;
    unhighlightEl(activeEl);
    activeEl = null;
  }

  // ===== 高亮/取消高亮 =====
  function highlightEl(el) {
    if (el) {
      el.classList.add('playing');
      // 也给所在的行/卡片加微妙的背景
      var row = el.closest('tr');
      if (row) row.classList.add('audio-playing');
    }
  }
  function unhighlightEl(el) {
    if (el) {
      el.classList.remove('playing');
      var row = el.closest('tr');
      if (row) row.classList.remove('audio-playing');
    }
  }

  // ===== 绑定 .click-speak 点击事件 =====
  function bindClickToSpeak() {
    var els = document.querySelectorAll('.click-speak[data-ar]');
    for (var i = 0; i < els.length; i++) {
      els[i].addEventListener('click', function (e) {
        e.stopPropagation();
        playArabic(this.getAttribute('data-ar'), this);
      });
    }
    // 绑定 sound-item 和 num-item
    var sounds = document.querySelectorAll('.sound-item, .num-item');
    for (var j = 0; j < sounds.length; j++) {
      sounds[j].addEventListener('click', function (e) {
        e.stopPropagation();
        // 这些元素通过 onclick 调用 speak()，我们拦截并传递元素
        var text = this.getAttribute('data-ar');
        if (!text) {
          // 尝试从 onclick 中提取
          var oc = this.getAttribute('onclick');
          if (oc) {
            var m = oc.match(/speak\('([^']+)'\)/);
            if (m) text = m[1];
          }
        }
        if (text) playArabic(text, this);
      });
    }
  }

  // ===== 滚动进度条 =====
  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    });
  }

  // ===== 导航栏滚动变色 =====
  function initNavScroll() {
    var nav = document.querySelector('.top-nav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ===== 移动端汉堡菜单 =====
  function initMobileMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // ===== 滚动进入动画 (IntersectionObserver) =====
  function initScrollAnimation() {
    // IntersectionObserver 不支持的旧浏览器直接显示
    if (!window.IntersectionObserver) {
      document.querySelectorAll('.content-card, .unit-card, .grammar-box, .cultura-box')
        .forEach(function (el) { el.style.opacity = ''; });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.content-card, .unit-card, .grammar-box, .cultura-box')
      .forEach(function (el) {
        if (!el.classList.contains('animate-in')) {
          el.style.opacity = '0';
          observer.observe(el);
        }
      });
  }

  // ===== 启动 =====
  function init() {
    initScrollProgress();
    initNavScroll();
    initMobileMenu();
    bindClickToSpeak();
    setTimeout(initScrollAnimation, 200);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();

  // ===== 全局 API =====
  window.speak          = playArabic;
  window.arabicSpeech   = {
    play:    playArabic,
    stop:    stopPlayback,
    isPlaying: function () { return isPlaying; }
  };

})();

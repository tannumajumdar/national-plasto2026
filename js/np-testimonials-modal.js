/**
 * National Plasto - Testimonials Video & Media Lightbox Modal
 * Opens full-size video or facility photo in an uncropped popup player.
 */
(function () {
  'use strict';

  function initTestimonialsModal() {
    var modal = document.getElementById('npTestiModal');
    if (!modal) return;

    var backdrop = modal.querySelector('.np-testi-modal__backdrop');
    var closeBtn = modal.querySelector('.np-testi-modal__close');
    var mediaContainer = modal.querySelector('.np-testi-modal__media-container');
    var badgeEl = modal.querySelector('.np-testi-modal__badge');
    var titleEl = modal.querySelector('.np-testi-modal__title');
    var descEl = modal.querySelector('.np-testi-modal__desc');

    function closeModal() {
      if (!modal.classList.contains('active')) return;
      modal.classList.remove('active');
      document.body.classList.remove('np-modal-open');

      if (mediaContainer) {
        var video = mediaContainer.querySelector('video');
        if (video) {
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
          } catch (e) {}
        }
        mediaContainer.innerHTML = '';
      }
    }

    function openModalWithVideo(src, title, tag, desc) {
      if (!mediaContainer) return;
      mediaContainer.innerHTML = '';

      var video = document.createElement('video');
      video.className = 'np-modal-video';
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = src;

      var source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);

      mediaContainer.appendChild(video);

      if (badgeEl) badgeEl.textContent = tag || 'Video Testimonial';
      if (titleEl) titleEl.textContent = title || '';
      if (descEl) descEl.textContent = desc || '';

      modal.classList.add('active');
      document.body.classList.add('np-modal-open');

      video.load();
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Fallback if browser blocks autoplay
        });
      }
    }

    function openModalWithPhoto(src, title, tag, desc) {
      if (!mediaContainer) return;
      mediaContainer.innerHTML = '';

      var img = document.createElement('img');
      img.className = 'np-modal-photo';
      img.src = src;
      img.alt = title || 'Facility Showcase';

      mediaContainer.appendChild(img);

      if (badgeEl) badgeEl.textContent = tag || 'Photo Showcase';
      if (titleEl) titleEl.textContent = title || '';
      if (descEl) descEl.textContent = desc || '';

      modal.classList.add('active');
      document.body.classList.add('np-modal-open');
    }

    // Attach click listeners to all video triggers
    document.querySelectorAll('.np-video-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var src = this.getAttribute('data-video');
        var title = this.getAttribute('data-title');
        var tag = this.getAttribute('data-tag');
        var desc = this.getAttribute('data-desc');
        if (src) {
          openModalWithVideo(src, title, tag, desc);
        }
      });
    });

    // Attach click listeners to photo triggers
    document.querySelectorAll('.np-photo-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var src = this.getAttribute('data-photo');
        var title = this.getAttribute('data-title');
        var tag = this.getAttribute('data-tag');
        var desc = this.getAttribute('data-desc');
        if (src) {
          openModalWithPhoto(src, title, tag, desc);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsModal);
  } else {
    initTestimonialsModal();
  }
})();


// CMR-BCA BLOGS: Client-side Interactivity

document.addEventListener('DOMContentLoaded', () => {
    // Add a little pop to comment submissions
    const commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
        form.addEventListener('submit', () => {
            const btn = form.querySelector('.btn');
            btn.innerHTML = 'Sending... ✨';
            btn.style.opacity = '0.7';
        });
    });

    // Handle like button animation
    const likeButtons = document.querySelectorAll('.btn-like');
    likeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 200);
        });
    });
});

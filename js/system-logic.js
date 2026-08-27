document.addEventListener("DOMContentLoaded", () => {
    console.log("System Logic Initialized");

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser') || 'Guest';

    // 0. Custom Bootstrap Modal Function
    window.showBootstrapAlert = function(message, title="Notification", redirectUrl=null) {
        // Remove existing modal if any
        $('#systemAlertModal').remove();
        
        const modalHtml = `
        <div class="modal fade" id="systemAlertModal" tabindex="-1" role="dialog" aria-labelledby="systemAlertModalLabel">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="systemAlertModalLabel">${title}</h4>
              </div>
              <div class="modal-body">
                <p>${message}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-dismiss="modal">OK</button>
              </div>
            </div>
          </div>
        </div>`;
        
        $('body').append(modalHtml);
        $('#systemAlertModal').modal('show');
        
        if (redirectUrl) {
            $('#systemAlertModal').on('hidden.bs.modal', function () {
                window.location.href = redirectUrl;
            });
        }
    };

    // 1. Dynamic Navbar Logic
    const navLinks = document.querySelectorAll('.nav.navbar-nav li a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (isLoggedIn) {
            if (href === 'register.html') {
                link.parentElement.style.display = 'none';
            }
            if (href === 'signin.html' && link.textContent.trim() === 'Login') {
                link.textContent = 'Welcome, ' + currentUser;
                link.setAttribute('href', '#');
                // Use standard bootstrap text-info class color roughly
                link.style.color = '#3498db'; 
            }
            if (href === 'signin.html' && link.textContent.trim() === 'Exit') {
                link.textContent = 'Logout';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('currentUser');
                    window.location.href = 'HomePage.html';
                });
            }
        } else {
            if (href === 'signin.html' && link.textContent.trim() === 'Exit') {
                link.parentElement.style.display = 'none';
            }
            // Hide protected tabs if not logged in
            if (href === 'Add Book.html' || href === 'Borrow Book.html' || href === 'Return Book.html') {
                link.parentElement.style.display = 'none';
            }
            // Also hide URLs that might have spaces encoded as %20
            if (href === 'Add%20Book.html' || href === 'Borrow%20Book.html' || href === 'Return%20Book.html') {
                link.parentElement.style.display = 'none';
            }
        }
    });

    // 2. Auth Guarding (Protecting Routes)
    const currentPath = window.location.pathname;
    const protectedRoutes = ['Add%20Book.html', 'Borrow%20Book.html', 'Return%20Book.html'];
    
    const isProtected = protectedRoutes.some(route => currentPath.includes(route) || currentPath.includes(decodeURIComponent(route)));
    
    if (isProtected && !isLoggedIn) {
        showBootstrapAlert("Authentication Required! Please login first to access this page.", "Access Denied", 'signin.html');
    }

    // 3. Login / Register Form Handlers
    const loginForm = document.querySelector('form.login');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Find if it's the login page
            if (currentPath.includes('signin.html')) {
                e.preventDefault();
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', 'Admin'); // Dummy user
                showBootstrapAlert("Login successful! Welcome back.", "Success", 'HomePage.html');
            } 
            else if (currentPath.includes('register.html')) {
                e.preventDefault();
                showBootstrapAlert("Registration successful! Please login.", "Success", 'signin.html');
            }
        });
    }

    // 4. Borrow Book Handler
    if (currentPath.includes('Borrow') && currentPath.includes('Book') && loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bookTitleInput = loginForm.querySelector('input[type="text"]').value;
            if(bookTitleInput) {
                let borrowed = JSON.parse(localStorage.getItem('borrowedBooks')) || [];
                borrowed.push(bookTitleInput.trim().toLowerCase());
                localStorage.setItem('borrowedBooks', JSON.stringify(borrowed));
                showBootstrapAlert(`Book "${bookTitleInput}" has been borrowed successfully!`, "Borrow Success", 'LIST OF BOOK.html');
            }
        });
    }

    // 5. Book List Rendering (LIST OF BOOK.html)
    if (currentPath.includes('LIST') && currentPath.includes('BOOK')) {
        let borrowed = JSON.parse(localStorage.getItem('borrowedBooks')) || [];
        
        const bookItems = document.querySelectorAll('.booksmedia-fullwidth figure');
        bookItems.forEach(figure => {
            const titleElement = figure.querySelector('figcaption header h4 a');
            if (titleElement) {
                const title = titleElement.textContent.trim().toLowerCase();
                if (borrowed.includes(title)) {
                    // Add badge using bootstrap label classes
                    const badge = document.createElement('span');
                    badge.className = 'label label-danger';
                    badge.style.position = 'absolute';
                    badge.style.top = '10px';
                    badge.style.right = '10px';
                    badge.style.zIndex = '10';
                    badge.textContent = 'Borrowed';
                    
                    figure.style.position = 'relative';
                    figure.appendChild(badge);

                    // Disable the Add to Cart/Borrow button
                    const borrowBtn = figure.querySelector('.fa-shopping-cart').parentElement;
                    if (borrowBtn) {
                        borrowBtn.classList.add('disabled');
                        borrowBtn.style.pointerEvents = 'none';
                        borrowBtn.style.opacity = '0.5';
                        borrowBtn.title = "Not Available";
                        borrowBtn.addEventListener('click', (e) => e.preventDefault());
                    }
                }
            }
        });
    }
});

// Shopping cart functionality
let cart = [];

// Add event listeners to all "Add to Cart" buttons
document.addEventListener('DOMContentLoaded', function() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = productCard.querySelector('.price').textContent;
            
            addToCart({
                name: productName,
                price: productPrice
            });
            
            // Visual feedback
            this.textContent = 'Added!';
            this.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                this.textContent = 'Add to Cart';
                this.style.backgroundColor = '#3498db';
            }, 1500);
        });
    });
});

function addToCart(product) {
    cart.push(product);
    console.log('Product added to cart:', product);
    console.log('Current cart:', cart);
    updateCartCount();
}

function updateCartCount() {
    console.log(`Total items in cart: ${cart.length}`);
    // You can add a cart counter badge in the UI here
}

// Console message for developers
console.log('Website Store - Ready for push notifications from Visual Studio');
console.log('Watching for incoming changes...');

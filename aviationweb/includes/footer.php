</main>

<footer class="site-footer">
    <div class="container footer-grid">
        <div class="footer-col">
            <h3 class="footer-heading">
                <i class="fa-solid fa-plane"></i>
                <?php echo htmlspecialchars(SITE_NAME); ?>
            </h3>
            <p class="footer-text">
                Your trusted source for the latest aviation news, airline updates, airport developments, and aerospace technology from around the world.
            </p>
        </div>

        <div class="footer-col">
            <h3 class="footer-heading">Categories</h3>
            <ul class="footer-links">
                <li><a href="/category.php?slug=airline-news">Airlines</a></li>
                <li><a href="/category.php?slug=airport-news">Airports</a></li>
                <li><a href="/category.php?slug=aerospace">Aerospace</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h3 class="footer-heading">Quick Links</h3>
            <ul class="footer-links">
                <li><a href="/">Home</a></li>
                <li><a href="/search.php">Search</a></li>
                <li><a href="/shorts.php">Shorts</a></li>
                <li><a href="/flight.php">Flight Tracker</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h3 class="footer-heading">Connect</h3>
            <div class="footer-social">
                <a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a>
                <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
            </div>
            <form class="newsletter-form" onsubmit="return false;">
                <label for="newsletter-email" class="footer-heading" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Newsletter</label>
                <div class="newsletter-input-group">
                    <input type="email" id="newsletter-email" placeholder="Your email" required>
                    <button type="submit" aria-label="Subscribe"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </form>
        </div>
    </div>

    <div class="footer-bottom">
        <div class="container">
            <p>&copy; 2024 <?php echo htmlspecialchars(SITE_NAME); ?>. All rights reserved.</p>
        </div>
    </div>
</footer>

<script src="/assets/js/app.js"></script>
</body>
</html>

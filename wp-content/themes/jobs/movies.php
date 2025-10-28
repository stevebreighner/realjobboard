<?php
/* Template Name: Movies */
get_header();
?>

<div class="container clearfix" style="margin-top: 100px;">
    <h1>Find Where to Watch Your Movie or Show</h1>

    <!-- Search Bar -->
    <input type="text" id="searchInput" placeholder="Enter movie or show title (e.g., Vertigo or Doctor Who)">
    <button onclick="searchMovie()">Search</button>

    <!-- Country selector -->
    <select id="countrySelect" style="margin-left:10px;">
        <option value="US" selected>US</option>
        <option value="GB">UK</option>
        <option value="CA">Canada</option>
        <option value="AU">Australia</option>
        <!-- Add more as needed -->
    </select>

    <!-- Results Section -->
    <div class="sb-posts-grid" id="results" style="margin-top: 20px;"></div>
</div>

<style>
.sb-posts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
}
.sb-post {
    border: 1px solid #ddd;
    padding: 1.5rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.05);
}
.sb-post h2, .sb-post h2 a { 
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
}
.sb-post p { color: #333; font-size: 1.1rem; }
.sb-post-meta {
    font-size: 0.9rem;
    color: #777;
    margin-bottom: 1rem;
}
.sb-post-excerpt {
    font-size: 1rem;
    margin-bottom: 1rem;
}
.sb-readmore {
    color: #0073aa;
    text-decoration: none;
    font-weight: bold;
}
.sb-readmore:hover {
    text-decoration: underline;
}
</style>

<script>
async function searchMovie() {
    const query = document.getElementById("searchInput").value.trim();
    const countryCode = document.getElementById("countrySelect").value;
    const resultsDiv = document.getElementById("results");

    if (!query) {
        resultsDiv.innerHTML = "<p>Please enter a movie or show title.</p>";
        return;
    }

    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        // Search titles by name via WP REST API proxy
        const searchUrl = `/wp-json/movie/v1/search?query=${encodeURIComponent(query)}`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) throw new Error("Search request failed");
        const searchData = await searchResponse.json();

        if (!searchData.title_results || searchData.title_results.length === 0) {
            resultsDiv.innerHTML = `<p>No results found for "<strong>${query}</strong>". Try another title.</p>`;
            return;
        }

        // Take first (best) match
        const bestMatch = searchData.title_results[0];
        const movieId = bestMatch.id;
        const movieName = bestMatch.name;

        // Fetch streaming sources via WP REST API proxy with country code
        const sourcesUrl = `/wp-json/movie/v1/sources?id=${movieId}&country_code=${countryCode}`;
        const sourcesResponse = await fetch(sourcesUrl);
        if (!sourcesResponse.ok) throw new Error("Sources request failed");
        const sourcesData = await sourcesResponse.json();

        if (!Array.isArray(sourcesData) || sourcesData.length === 0) {
            resultsDiv.innerHTML = `<p>No streaming or purchase sources found for "<strong>${movieName}</strong>".</p>`;
            return;
        }

        // Deduplicate helper
        function uniqueByName(arr) {
            const seen = new Set();
            return arr.filter(item => {
                if (seen.has(item.name)) return false;
                seen.add(item.name);
                return true;
            });
        }

        // Streaming platforms: type "sub" or "free"
        const streaming = uniqueByName(
            sourcesData.filter(s => s.type === 'sub' || s.type === 'free')
        );

        // Buy/rent platforms: type "buy" or "rent"
        const buyRent = uniqueByName(
            sourcesData.filter(s => s.type === 'buy' || s.type === 'rent')
        );

        // Remove buy/rent platforms that are also streaming (avoid duplicates)
        const streamingNames = new Set(streaming.map(s => s.name));
        const filteredBuyRent = buyRent.filter(s => !streamingNames.has(s.name));

        let availabilityText = "";

        if (streaming.length > 0) {
            availabilityText += "<strong>Available to stream on:</strong> " + streaming.map(s => s.name).join(", ") + ".<br>";
        }

        if (filteredBuyRent.length > 0) {
            availabilityText += "<strong>Available to buy or rent on:</strong> " + filteredBuyRent.map(s => s.name).join(", ") + ".";
        }

        if (!availabilityText) {
            availabilityText = "Not available on subscription or free streaming platforms, or for purchase/rent in your selected country.";
        }

        resultsDiv.innerHTML = `
            <div class="sb-post">
                <h2>${movieName}</h2>
                <p>${availabilityText}</p>
                <button onclick="searchMovie()">Search Again</button>
            </div>
        `;

    } catch (error) {
        console.error("Error fetching data:", error);
        resultsDiv.innerHTML = `<p>Error occurred: ${error.message}</p>`;
    }
}
</script>

<?php get_footer(); ?>

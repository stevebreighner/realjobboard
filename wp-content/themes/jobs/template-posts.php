<?php
/* Template Name: SB Posts Listing */
get_header();
?>

<div class="container clearfix" style="margin-top: 100px;">
    <div class="sb-posts-grid">
        <?php
        $paged = get_query_var('paged') ? get_query_var('paged') : 1;
        $query = new WP_Query([
            'post_type' => 'post',
            'posts_per_page' => 10,
            'paged' => $paged,
        ]);
 
        if ($query->have_posts()) :
            while ($query->have_posts()) : $query->the_post(); ?>
                <div class="sb-post">
                    <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                    <div class="sb-post-meta"><?php echo get_the_date(); ?> | <?php the_author(); ?></div>
                    <div class="sb-post-excerpt"><?php the_excerpt(); ?></div>
                    <a class="sb-readmore" href="<?php the_permalink(); ?>">&rarr;</a>
                </div>
            <?php endwhile;?>
 

 
 <div class="page-navigation">
    <?php
    echo paginate_links([
        'total' => $query->max_num_pages,
        'current' => $paged,
        'mid_size' => 2,
        'prev_text' => __('« Prev', 'textdomain'),
        'next_text' => __('Next »', 'textdomain'),
    ]);
    ?>
</div><?php 
        else : ?>
            <p>No posts found.</p>
        <?php endif;
        wp_reset_postdata();
        ?>
    </div>
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
.sb-post h2,.sb-post h2 a{ 
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
}
.sb-post h2 p{color:black;}
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
    text-decoration: underline;}
    /* Center the pagination container */
.page-navigation {
    display: flex;
    justify-content: center; /* Centers the pagination */
    align-items: center;
    margin-top: 40px; /* Add some space above */
    margin-bottom: 40px; /* Add some space below */
}

/* Style for individual page links */
.page-numbers {
    background-color: #fff;
    border: 1px solid #ddd;
    padding: 10px 20px;
    margin: 0 5px;
    text-decoration: none;
    color: #333;
    font-size: 1rem;
    border-radius: 5px;
}

/* Hover and active state for page numbers */
.page-numbers:hover,
.page-numbers.current {
    background-color: var(--dark-red);
    color: #fff;


}

/* Styling for 'Previous' and 'Next' buttons */
.page-numbers.prev,
.page-numbers.next {
    font-weight: bold;
    padding: 10px 15px;
}

.page-numbers.prev:hover,
.page-numbers.next:hover {
    background-color: var(--danger);
    color: #fff;
}

/* Disabled state for page numbers (e.g. when on first or last page) */
.page-numbers.disabled {
    pointer-events: none;
    background-color: #f1f1f1;
    color: #ddd;
}

}
</style>

<?php get_footer(); ?>

<?php
// Register the "job" custom post type
function jobs_register_job_post_type() {
    $labels = [
        'name'               => __('Jobs', 'jobs'),
        'singular_name'      => __('Job', 'jobs'),
        'menu_name'          => __('Jobs', 'jobs'),
        'name_admin_bar'     => __('Job', 'jobs'),
        'add_new'            => __('Add New', 'jobs'),
        'add_new_item'       => __('Add New Job', 'jobs'),
        'new_item'           => __('New Job', 'jobs'),
        'edit_item'          => __('Edit Job', 'jobs'),
        'view_item'          => __('View Job', 'jobs'),
        'all_items'          => __('All Jobs', 'jobs'),
        'search_items'       => __('Search Jobs', 'jobs'),
        'parent_item_colon'  => __('Parent Jobs:', 'jobs'),
        'not_found'          => __('No jobs found.', 'jobs'),
        'not_found_in_trash' => __('No jobs found in Trash.', 'jobs'),
    ];

    $args = [
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => ['slug' => 'jobs'],
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 5,
        'menu_icon'          => 'dashicons-id-alt', // job-related icon
        'supports'           => ['title', 'editor', 'thumbnail', 'custom-fields', 'excerpt'],
        'show_in_rest'       => true, // Enable Gutenberg and REST API support
    ];

    register_post_type('job', $args);
}
add_action('init', 'jobs_register_job_post_type');

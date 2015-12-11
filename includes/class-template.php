<?php



// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;



Kanban_Template::init();



class Kanban_Template
{
	private static $instance;

	static $page_slugs = array(
		'board' => array(
			'style' => array(
				'board' => '%s/css/board.css'
			),
			'script' => array(
				'jquery-ui' => "//code.jquery.com/ui/1.11.3/jquery-ui.min.js",
				'bootstrap' => "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js",
				'bootstrap-growl' => "//cdnjs.cloudflare.com/ajax/libs/bootstrap-growl/1.0.0/jquery.bootstrap-growl.min.js",
				'autoresize' => "%s/js/jquery.textarea.autoresize.min.js",
				'same-height' => "%s/js/jquery.same-height.min.js",
				't' => "%s/js/t.min.js",
				'board-modal-projects' => "%s/js/board-modal-projects.min.js",
				'board-sidebar-header' => "%s/js/board-sidebar-header.min.js",
				// 'board-tour' => "%s/js/board-tour.min.js",
				'board-search' => "%s/js/board-search.min.js",
				'board-filter' => "%s/js/board-filter.min.js",
				'board-view' => "%s/js/board-view.min.js",
				'board-task' => "%s/js/board-task.min.js",
				'board' => "%s/js/board.min.js"
			)
		),
		'login' => array()
	);



	static function init()
	{
		self::$page_slugs = apply_filters(
			sprintf('%s_Template_init', Kanban::get_instance()->settings->basename),
			self::$page_slugs
		);

		add_action( 'init', array(__CLASS__, 'protect_slug') );

		add_filter('template_include', array(__CLASS__, 'template_chooser'), 99);

	}



	static function protect_slug ()
	{
		// only protect pages with our slug
	    if ( strpos($_SERVER['REQUEST_URI'], sprintf('/%s/', Kanban::$slug)) === FALSE ) return;


		// admins can see anything
		// if ( current_user_can('manage_options') ) return;


		// get my id, and allowed id's
		$current_user_id = get_current_user_id();

		$users_field_name = sprintf('%s_user', Kanban::get_instance()->settings->basename);
		$allowed_user_ids = Kanban_User::get_allowed_users();

		// return if I'm allowed
		if ( in_array($current_user_id, array_keys($allowed_user_ids)) )
		{
			// redirect away from login
		    if ( strpos($_SERVER['REQUEST_URI'], sprintf('/%s/login', Kanban::$slug)) !== FALSE )
		    {
		    	wp_redirect(sprintf('/%s/board', Kanban::$slug));
				exit;
		    }
		    else
		    {
		    	return;
		    }

		}

		// allow for addition checks
		do_action( sprintf('%s_protect_slug', Kanban::get_instance()->settings->basename) );

		// anyone can see login screen
	    if ( strpos($_SERVER['REQUEST_URI'], sprintf('/%s/login', Kanban::$slug)) !== FALSE ) return;

	    // otherwise redirect to login
		wp_redirect(sprintf('/%s/login', Kanban::$slug));
		exit;
	}



	static function template_chooser($template)
	{
		if ( is_admin() ) return $template;



		// if url doesn't include our slug, return
		if ( strpos($_SERVER['REQUEST_URI'], sprintf('/%s/', Kanban::$slug)) === FALSE ) return $template;



		// allow for additional pages
		self::$page_slugs = apply_filters( sprintf('%s_template_pages', Kanban::get_instance()->settings->basename), self::$page_slugs );

		foreach (self::$page_slugs as $slug => $data)
		{
	 		if ( strpos(strtok($_SERVER["REQUEST_URI"],'?'), sprintf('%s/%s', Kanban::$slug, $slug)) !== FALSE )
			{
				$template = Kanban_Template::find_template($slug);

				if ( !empty($template) )
				{
					self::get_instance()->slug = $slug;

					if ( isset($data['style']) )
					{
						foreach ($data['style'] as $handle => $path)
						{
							if ( !isset(self::get_instance()->style) || !is_array(self::get_instance()->style) )
							{
								self::get_instance()->style = array();
							}

							if ( strpos($path, '%s') !== FALSE )
							{
								$path = sprintf($path, Kanban::get_instance()->settings->uri);
							}

							self::get_instance()->style[$handle] = $path;
						}
					}

					if ( isset($data['script']) )
					{
						foreach ($data['script'] as $handle => $path)
						{
							if ( !isset(self::get_instance()->script) || !is_array(self::get_instance()->script) )
							{
								self::get_instance()->script = array();
							}

							if ( strpos($path, '%s') !== FALSE )
							{
								$path = sprintf($path, Kanban::get_instance()->settings->uri);
							}

							if ( defined('KANBAN_DEBUG') && KANBAN_DEBUG === TRUE )
							{
								$path = str_replace('.min', '', $path);
							}


							self::get_instance()->script[$handle] = $path;
						}
					}
				}
			}
		}

		self::get_instance()->template = $template;

		// page found. set the header
		status_header(200);

		// allow additional templates
		return apply_filters( sprintf('%s_after_template_chooser', Kanban::get_instance()->settings->basename), $template );
	}



	static function find_template($basename)
	{
		// look for template in theme/name_of_class
		$template = sprintf('%s/%s/%s', get_stylesheet_directory(), Kanban::get_instance()->settings->basename, sprintf('%s.php', $basename));

		// if not found, look for it in the plugin
		if ( !is_file($template) )
		{
			$template = sprintf('%s/templates/%s', Kanban::get_instance()->settings->path, sprintf('%s.php', $basename));
		}

		// if not found, use the theme default
		if ( !is_file($template) )
		{
			$template = sprintf('%s/%s', get_stylesheet_directory(), sprintf('%s.php', $basename));
		}

		// if not found, use the original
		if ( !is_file($template) )
		{
			$template = false;
		}

		return apply_filters( sprintf('%s_find_template', Kanban::get_instance()->settings->basename), $template );
	}



	static function render_template ($basename, $data = array())
	{
		$template_path = Kanban_Template::find_template($basename);

		if ( !$template_path ) return false;

		extract($data);
		ob_start();
		include $template_path;
		$html_output = ob_get_contents();
		ob_end_clean();

		return $html_output;
	} // render_email_template



	static function add_style()
	{
		if ( !isset(self::get_instance()->style) || !is_array(self::get_instance()->style) ) return;

		foreach (self::get_instance()->style as $handle => $path)
		{
			echo sprintf(
				'<link rel="stylesheet" id="%s-css" href="%s">' . "\n",
				$handle,
				$path
			);
		}
	}



	static function add_script()
	{
		if ( !isset(self::get_instance()->script) || !is_array(self::get_instance()->script) ) return;

		foreach (self::get_instance()->script as $handle => $path)
		{
			echo sprintf(
				'<script id="%s-js" src="%s"></script>' . "\n",
				$handle,
				$path
			);
		}
	}



	public static function get_instance()
	{
		if ( ! self::$instance )
		{
			self::$instance = new self();
		}
		return self::$instance;
	}



	private function __construct() { }

} // Kanban_Template



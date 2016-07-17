(function() {

  /* utils */

  function keys(obj) { return Object.keys(obj) }
  function vals(obj) { return keys(obj).map(function(k) { return obj[k] }) }
  function extend(a, b) { for (var k in b) a[k] = b[k]; return a }
  function projectsByCategoryIndex(projects, categoryIndex) {
    return projects.filter(function(p) { return p.categoryIndex === categoryIndex })
  }

  /* components */

  var Portfolio = React.createClass({

    render: function() {

      var $categories = this.props.$root.refine('categories')
      var $projects = this.props.$root.refine('projects')
      var $ui = this.props.$root.refine('ui')

      return (
        <div>
          <Menu $categories={$categories} $projects={$projects} $ui={$ui} />
          <Content $projects={$projects} $ui={$ui} $categories={$categories} />
        </div>
      )
    }
  })

  var Image = React.createClass({

    getInitialState: function() {
      return { loaded: false }
    },

    handleLoad: function() {
      setTimeout(function() { this.setState({ loaded: true }) }.bind(this), 1000)
    },

    render: function() {

			// wtf?
      var classes = this.props.className
      var others = extend({}, this.props)
      delete others.className

      classes += ' image'

      if (this.state.loaded) {
        return (
          <img {...others} className={classes} />
        )
      } else {
        classes += ' loading'
        return (
          <img {...others} onLoad={this.handleLoad} className={classes} />
        )
      }
    }
  })

  var Menu = React.createClass({
    
    render: function() {

      var categories = this.props.$categories.deref()
      var projects = this.props.$projects.deref()
      var $currentCategories = this.props.$ui.refine('currentCategories')

      return (
        <div id="menu">
          <h1>Brendan Barr <small>A Code Portfolio</small></h1>
          <div id="category-selectors">
          	{
          		categories.map((c, i) => {
								return <div 
									className={`category-selector ${c.className} ${$currentCategories.deref()[i] ? 'active' : ''}`}
									onClick={() => $currentCategories.refine(i).update({ $apply: val => !val })}>
									{ c.name }
								</div>
							})
						}
          </div>
          <div className="contact">
            <p><a href="http://bbarr.github.io">Blog</a></p>
            <p><a href="https://github.com/bbarr">Code</a></p>
            <p><a href="https://angel.co/brendan-barr-1">Resume</a></p>
            <p><a href="mailto:bbarr1384@gmail.com">bbarr1384@gmail.com</a></p>
          </div>
        </div>
      )
    }
  })

  var Content = React.createClass({

    render: function() {

      var projects = this.props.$projects.deref()
      var selected = this.props.$ui.get('selected')
      var currentIndex = this.props.$ui.get('currentProjectIndex')
      var visibleCategories = this.props.$ui.get('currentCategories')

      return (
        <div id="content">
          {
            projects.map(function(p, i) {

            	if (!visibleCategories[p.categoryIndex]) 
            		return null

              return <ContentProject
                $ui={this.props.$ui}
                $project={this.props.$projects.refine(i)}
                $categories={this.props.$categories}
                isSelected={selected === p.name}
                isInitializing={this.props.$ui.get('loadingProjectIndex') <= i}
              />
            }, this)
          }
        </div>
      )
    }
  })

  var ContentProject = React.createClass({

    getInitialState: function() {
      return { imageIndex: 0 }
    },

    thumbPicker: function(index) {
      return function() {
        this.setState({ imageIndex: index })
      }.bind(this)
    },

    componentDidUpdate: function() {
      var el = this.refs.el.getDOMNode()
    },

    renderGallery: function(images) {
      if (!images.length) return

      return <div className="gallery">
        <Image className="big" src={images[this.state.imageIndex]} />
        <div className="thumbs">
          { 
            images.map(function(src, i) { 
              return <Image src={src} onClick={this.thumbPicker(i)} />
            }, this) 
          }
        </div>
      </div>
    },

    render: function() {
      
      var p = this.props.$project.deref()
      var cats = this.props.$categories.deref()
      var cat = cats[p.categoryIndex]

      var classes = React.addons.classSet({
        selected: this.props.isSelected,
        project: true,
        init: this.props.isInitializing
      })
      
      return (
        <div ref="el" className={classes + ' category-border ' + cat.className}>
          <h3>
            { p.name } 
            <small className={"category-bg " + cat.className}>{cat.name}</small>
          </h3>
          { p.images.length ? this.renderGallery(p.images) : null }
          { p.repo ? <div className="gallery"><a target="replwithoutacause-repo" className="repo-link big" href={p.repo}>View Code</a></div> : null }
          <div className="details">
            <div className="detail">
              { 
              	p.description ? 
									<div dangerouslySetInnerHTML={{ __html: marked(p.description) }}></div> :
									null
							}
            </div>
            <div className="detail">
              <strong>Link:</strong>
              <p><a href={ p.link }>{ p.link }</a></p>
            </div>
            <div className="detail">
              <strong>Technologies:</strong>
              <p className="technologies">
                { 
                  p.technologies.map(function(t) { return <span>{t}</span> }) 
                }
              </p>
            </div>
            <div className="detail">
              <strong>My Role:</strong>
              <p>{ p.role }</p>
            </div>
          </div>
        </div>
      )
    }
  })

  /* implementation */
  var imgRoot = window.location.protocol + '//' + window.location.host + '/thumbs'

  var data = {

    ui: {
      selected: null,
      loadingProjectIndex: 0,
      currentProjectIndex: 0,
      currentCategories: [ true, true, true ],
    },

    categories: [
      { name: 'Open-source projects', className: 'other-code' },
      { name: 'Start-ups', className: 'start-up' },
      { name: 'Client work', className: 'clients' },
    ],

    projects: [
      {
        categoryIndex: 0,
        name: 'medium',
        technologies: [ 'Javascript', 'Functional Programming', 'CSP' ],
        role: 'Author',
        link: 'https://www.npmjs.com/package/medium',
        images: [  ],
        description: [
          "CSP-style channel library using ES7 async/await keywords"
        ].join(''),
        repo: 'http://github.com/bbarr/medium'
      },
      { categoryIndex: 0,
        name: 'ulmus',
        technologies: [ 'Javascript' ],
        role: 'Author',
        link: 'http://github.com/bbarr/ulmus',
        images: [  ],
        description: `
A minimal Elm-inspired state manager with zero dependencies.
        `,
        repo: 'http://github.com/bbarr/ulmus'
      },
      { 
        categoryIndex: 0,
        name: 'kisschema',
        technologies: [ 'Javascript' ],
        role: 'Author',
        link: 'http://github.com/bbarr/kisschema',
        images: [  ],
        description: `
ReactJS PropType-inspired schemas for plain old JS objects.
        `,
        repo: 'http://github.com/bbarr/kisschema'
      },
      { 
        categoryIndex: 0,
        name: 'kismatch',
        technologies: [ 'Javascript' ],
        role: 'Author',
        link: 'http://github.com/bbarr/kismatch',
        images: [  ],
        description: `
Creates functions that pattern-match their parameters
        `,
        repo: 'http://github.com/bbarr/kismatch'
      },
			{
				categoryIndex: 1,
				name: 'Finlit',
				technologies: [ 'Javascript', 'ReactJS', 'SASS', 'Webpack', 'Firebase', 'ASW/S3' ],
				role: 'Co-creator',
				link: 'http://finlit.io',
				description: `

**In Closed Beta, aiming for roll out at start of school season**

Financial education for the next generation.
Hands-on learning that engages kids and builds healthy money habits.
				`,
				images: [ imgRoot + '/finlit-1.png', imgRoot + '/finlit-2.png' ]
			},
      {
        categoryIndex: 1,
        name: 'Jot Cook',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Firebase', 'AWS/S3' ],
        role: 'All the things.',
        link: 'http://jotcook.com',
        description: "Create better recipes by keeping track of tweaks and tasting notes.",
        images: [ imgRoot + '/jotcook1.png', imgRoot + '/jotcook2.png', imgRoot + '/jotcook3.png' ]
      },
      {
        categoryIndex: 1,
        name: 'Orleans Pulse',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Parse', 'AWS/S3' ],
        role: 'Solo developer, working with business partner.',
        link: 'http://www.orleanspulse.com',
        description: [
          "Initial prototype for a town-centric community portal. We worked with the town of Orleans, MA. through a series of public forums and working sessions."
        ].join(''),
        images: [ imgRoot + '/orleanspulse1.png', imgRoot + '/orleanspulse2.png', imgRoot + '/orleanspulse3.png', ]
      },
      {
        categoryIndex: 1,
        name: 'Dataful Me',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'MongoDB', 'NodeJS', 'AWS/S3' ],
        role: 'All the things.',
        link: 'http://datafulme.herokuapp.com',
        description: `
**On hold**

User-defined statistics and event tracking. Custom DSL for powerful time-sensitive queries.
Web app portion is unfinished and has some rough edges, though the underlying web service is pretty complete."
				`,
        images: [ imgRoot + '/datafulme1.png', imgRoot + '/datafulme2.png' ]
      },
      {
        categoryIndex: 1,
        name: 'Co-Decide',
        technologies: [ 'Javascript', 'BackboneJS', 'Sass', 'Ruby', 'Sinatra', 'Heroku' ],
        role: 'All the things.',
        link: 'http://codeci.de',
        description: `
**On hold**

Group decision making without rehashing the same arguments over and over again. Define a problem or a question, then share with friends via email or Facebook, and get feedback.
        `,
        images: [ imgRoot + '/codecide1.png', imgRoot + '/codecide2.png' ],
      },
      {
        categoryIndex: 1,
        name: 'Buoy',
        technologies: [ 'Javascript', 'Ionic', 'Angular', 'Sass', 'Firebase' ],
        role: 'Co-creater, Lead developer',
        link: 'http://buoyapp.net',
        description: `
**On hold**

Location-based sticky notes.
        `,
        images: [ imgRoot + '/buoy1.jpg', imgRoot + '/buoy2.jpg' ]
      },
      { 
        categoryIndex: 2,
        name: 'Fortress to Solitude',
        technologies: [ 'Javascript', 'SASS', 'Ruby', 'Sinatra', 'MongoDB', 'Heroku', 'Stripe' ],
        role: 'Sole developer, full-stack. Worked closely with business owner, who also did most of the design work.',
        link: 'http://fortresstosolitude.com',
        description: [
          "Art/Framing e-commerce site. Guest curators select the artwork, and orders are fulfilled using local printers and framers in Brooklyn, NY",
          "Started on Shoppify, but later built a custom ruby back end for extra flexibility"
        ].join(''),
        images: [ imgRoot + '/fts1.png', imgRoot + '/fts2.png' ]
      },
      /*{
        categoryIndex: 1,
        name: 'howaboutwe.com',
        technologies: [ 'Javascript', 'SASS', 'Ruby', 'Rails', 'BackboneJS' ],
        role: 'More of a Javascript specialist here, but did some full-stack work. Helped drive a refactor of a too-heavy backbone.js mobile web app.',
        link: 'http://howaboutwe.com',
        description: [
        ],
        images: [ imgRoot + '/howaboutwe1.png' ]
      },
      {
        categoryIndex: 2,
        name: 'This Code Portfolio',
        technologies: [ 'Javascript', 'ReactJS', 'AWS/S3' ],
        role: 'Author',
        link: window.location.href,
        images: [  ],
        description: [
          "The code behind this site."
        ].join(''),
        repo: 'http://github.com/bbarr/replwithoutacause.com'
      },*/
    ]
  }

  var $root = ReactPointer({}, function() {
    React.render(<Portfolio $root={$root} />, document.getElementById('portfolio'))
  })

  $root.set(data)

  // this gets the projects to all fly in from the side
  var interval = setInterval(function() {
    var current = $root.get('ui.loadingProjectIndex')
    $root.update({ ui: { loadingProjectIndex: { $set: current + 1 } } })
    if (current === $root.get('projects').length) clearInterval(interval)
  }, 100)

})()

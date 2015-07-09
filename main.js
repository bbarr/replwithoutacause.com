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

    componentDidMount: function() {
      this
        .getDOMNode()
        .offsetParent
        .addEventListener('keydown', function (e) {
          var key = e.keyCode
          var currentProjectIndex = this.props.$root.get('ui.currentProjectIndex')
          if (key == 40 || key == 74) {
            if (!currentProjectIndex != this.props.$root.get('projects').length) 
              this.props.$root.update({ ui: { currentProjectIndex: { $set: currentProjectIndex + 1 } } })
          } else if (key == 38 || key == 75) {
            if (currentProjectIndex != 0) 
              this.props.$root.update({ ui: { currentProjectIndex: { $set: currentProjectIndex - 1 } } })
          }
        }.bind(this));
    },

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

      return (
        <div id="menu">
          <h1>Brendan Barr <small>A Code Portfolio</small></h1>
          <ul>
            { 
              categories.map(function(cat, i) {

                var catProjects = projectsByCategoryIndex(projects, i)
                if (!catProjects.length) return null

                return <MenuCategory 
                  $ui={this.props.$ui}
                  category={cat}
                  allProjects={projects}
                  projects={catProjects}
                />
              }, this)
            }
          </ul>
          <div className="contact">
            <p><a href="http://bbarr.github.io">Blog</a></p>
            <p><a href="https://github.com/bbarr">Code</a></p>
            <p><a href="https://www.linkedin.com/pub/brendan-barr/70/366/155">Resume</a></p>
            <p><a href="mailto:bbarr1384@gmail.com">bbarr1384@gmail.com</a></p>
          </div>
        </div>
      )
    }
  })

  var MenuCategory = React.createClass({

    render: function() {
      return (
        <li className={this.props.category.className + ' category-bg'}>
          <h3>{ this.props.category.name }</h3>
          <ul>
            {
              this.props.projects.map(function(p, i) {
                var index = this.props.allProjects.indexOf(p)
                return <MenuProject 
                  isInitializing={this.props.$ui.get('loadingProjectIndex') <= index}
                  isActive={this.props.$ui.get('currentProjectIndex') == index}
                  $ui={this.props.$ui} 
                  project={p} 
                  index={index} />
              }, this)
            }
            <li className="ignore">...work in progress, more to come.</li>
          </ul>
        </li>
      )
    }
  })

  var MenuProject = React.createClass({

    select: function(e) {
      this.props.$ui.update({ currentProjectIndex: { $set: this.props.index } })
    },

    render: function() {

      var project = this.props.project
      var $ui = this.props.$ui

      var classes = React.addons.classSet({
        init: this.props.isInitializing,
        active: this.props.isActive
      })

      return (
        <li className={classes} key={project.name} onClick={this.select}>
          { project.name }
        </li>
      )
    }
  })

  var Content = React.createClass({

    getInitialState: function() {
      return {}
    },

    componentDidMount: function() {
      var el = this.refs.el.getDOMNode()
    },

    getY: function(i) {
      if (!this.projectDivs || !this.projectDivs[0]) return 0
      return this.projectDivs[i].offsetTop - 10
    },

    move: function(e) {

      var currentProjectIndex = this.props.$ui.get('currentProjectIndex')

      var y = e.deltaY

      if (y > 1) {
        if (this.moving || currentProjectIndex == this.projectDivs.length) return
        this.moving = true
        this.props.$ui.update({ currentProjectIndex: { $set: currentProjectIndex + 1 } })
      } else if (y < -1) {
        if (this.moving || currentProjectIndex == 0) return
        this.moving = true
        this.props.$ui.update({ currentProjectIndex: { $set: currentProjectIndex - 1 } })
      } else {
        this.moving = false
      }
    },

    componentDidMount: function() {
      this.projectDivs = this.refs.el.getDOMNode().querySelectorAll('.project')
    },

    render: function() {

      var projects = this.props.$projects.deref()
      var selected = this.props.$ui.get('selected')
      var currentIndex = this.props.$ui.get('currentProjectIndex')
      var offsetY = this.getY(currentIndex)

      return (
        <div id="content" ref="el" onWheel={this.move} style={{ marginTop: -1 * offsetY }}>
          {
            projects.map(function(p, i) {
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
        <div ref="el" className={classes + ' category-border ' + cat.className} id={p.name.replace(/\s/g, '')}>
          <h3>
            { p.name } 
            <small className={"category-bg " + cat.className}>{cat.name}</small>
          </h3>
          { p.images.length ? this.renderGallery(p.images) : null }
          { p.repo ? <div className="gallery"><a target="replwithoutacause-repo" className="repo-link big" href={p.repo}>View Code</a></div> : null }
          <div className="details">
            <div className="detail">
              { p.description && p.description.length ? p.description.map(function(d) { return <p>{d}</p> }) : null }
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
      currentProjectIndex: 0
    },

    categories: [
      { name: 'Start-ups', className: 'start-up' },
      { name: 'client work', className: 'clients' },
      { name: 'other code (libraries, etc)', className: 'other-code' }
    ],

    projects: [],
    _projects: [
      {
        categoryIndex: 0,
        name: 'Jot Cook',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Firebase', 'AWS/S3' ],
        role: 'All the things.',
        link: 'http://jotcook.com',
        description: [
          "Create better recipes by keeping track of tweaks and tasting notes."
        ],
        images: [ imgRoot + '/jotcook1.png', imgRoot + '/jotcook2.png', imgRoot + '/jotcook3.png' ]
      },
      {
        categoryIndex: 0,
        name: 'Buoy',
        technologies: [ 'Javascript', 'Ionic', 'Angular', 'Sass', 'Firebase' ],
        role: 'Co-creater, Lead developer',
        link: 'http://buoyapp.net',
        description: [
          ' - Coming soon to IOS app store - ',
          'Location-based sticky notes.'
        ],
        images: [ imgRoot + '/buoy1.jpg', imgRoot + '/buoy2.jpg' ]
      },
      {
        categoryIndex: 0,
        name: 'Orleans Pulse',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Parse', 'AWS/S3' ],
        role: 'Solo developer, working with business partner.',
        link: 'http://www.orleanspulse.com',
        description: [
          "Initial prototype for a town-centric community portal. We worked with the town of Orleans, MA. through a series of public forums and working sessions."
        ],
        images: [ imgRoot + '/orleanspulse1.png', imgRoot + '/orleanspulse2.png', imgRoot + '/orleanspulse3.png', ]
      },
      {
        categoryIndex: 0,
        name: 'Dataful Me',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'MongoDB', 'NodeJS', 'AWS/S3' ],
        role: 'All the things.',
        link: 'http://datafulme.herokuapp.com',
        description: [
          "User-defined statistics and event tracking. Custom DSL for powerful time-sensitive queries. ",
          "Web app portion is unfinished and has some rough edges, though the underlying web service is pretty complete."
        ],
        images: [ imgRoot + '/datafulme1.png', imgRoot + '/datafulme2.png' ]
      },
      {
        categoryIndex: 0,
        name: 'Co-Decide',
        technologies: [ 'Javascript', 'BackboneJS', 'Sass', 'Ruby', 'Sinatra', 'Heroku' ],
        role: 'All the things.',
        link: 'http://codeci.de',
        description: [
          "Group decision making without rehashing the same arguments over and over again. Define a problem or a question, then share with friends via email or Facebook, and get feedback."
        ],
        images: [ imgRoot + '/codecide1.png', imgRoot + '/codecide2.png' ],
      },
      { 
        categoryIndex: 1,
        name: 'Fortress to Solitude',
        technologies: [ 'Javascript', 'SASS', 'Ruby', 'Sinatra', 'MongoDB', 'Heroku', 'Stripe' ],
        role: 'Sole developer, full-stack. Worked closely with business owner, who also did most of the design work.',
        link: 'http://fortresstosolitude.com',
        description: [
          "Art/Framing e-commerce site. Guest curators select the artwork, and orders are fulfilled using local printers and framers in Brooklyn, NY",
          "Started on Shoppify, but later built a custom ruby back end for extra flexibility"
        ],
        images: [ imgRoot + '/fts1.png', imgRoot + '/fts2.png' ]
      },
      {
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
        ],
        repo: 'http://github.com/bbarr/replwithoutacause.com'
      },
      {
        categoryIndex: 2,
        name: 'medium',
        technologies: [ 'Javascript', 'Functional Programming', 'CSP' ],
        role: 'Author',
        link: 'https://www.npmjs.com/package/medium',
        images: [  ],
        description: [
          "CSP-style channel library using ES7 async/await keywords"
        ],
        repo: 'http://github.com/bbarr/medium'
      },
      { 
        categoryIndex: 2,
        name: 'governor.js',
        technologies: [ 'Javascript', 'ReactJS' ],
        role: 'Author',
        link: 'http://github.com/bbarr/governorjs',
        images: [  ],
        description: [
          "Event-driven data stores for React"
        ],
        repo: 'http://github.com/bbarr/governorjs'
      },
      { categoryIndex: 2,
        name: 'VolaryFoundation/Eagle',
        technologies: [ 'Javascript', 'NodeJS', 'MongoDB', 'ExpressJS', 'Redis' ],
        role: 'Author',
        link: 'https://github.com/VolaryFoundation/Eagle',
        images: [  ],
        description: [
          "Service to normalize resources across external services.",
          "When we wanted to get information about a Group-type resource, we wanted to pull from various sources (like Meetup, Facebook, etc) and normalize the data for consumption in various clients."
        ],
        repo: 'https://github.com/VolaryFoundation/Eagle'
      },
      {
        categoryIndex: 2,
        name: 'decore.js',
        technologies: [ 'Javascript' ],
        role: 'Author',
        link: 'http://github.com/bbarr/decor',
        images: [  ],
        description: [
          "Javascript decorater-style wrapper for when you need that sort of thing."
        ],
        repo: 'http://github.com/bbarr/decor'
      },
      { categoryIndex: 2,
        name: 'pointer.js',
        technologies: [ 'Javascript', 'ReactJS' ],
        role: 'Author',
        link: 'http://github.com/bbarr/pointer-js',
        images: [  ],
        description: [
          "Om-inspired data links. Leverages React's immutable data addon"
        ],
        repo: 'http://github.com/bbarr/pointer-js'
      },
    ]
  }

  // handle hash (limited sets)
  var hash = window.location.hash.split('#')[1]
  if (hash) {
    data.projects = hash.split(',').map(function(index) {
      return data._projects[index]
    })
  } else {
    data.projects = data._projects.slice(0)
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

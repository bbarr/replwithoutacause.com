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
          {this.renderGallery(p.images)}
          <div className="details">
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
      { name: 'personal projects', className: 'start-up' },
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
        images: [ imgRoot + '/jotcook1.png', imgRoot + '/jotcook2.png', imgRoot + '/jotcook3.png' ]
      },
      {
        categoryIndex: 0,
        name: 'Orleans Pulse',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Parse', 'AWS/S3' ],
        role: 'Solo developer, working with business partner.',
        link: 'http://www.orleanspulse.com',
        images: [ imgRoot + '/orleanspulse1.png', imgRoot + '/orleanspulse2.png', imgRoot + '/orleanspulse3.png', ]
      },
      {
        categoryIndex: 0,
        name: 'Dataful Me',
        technologies: [ 'Javascript', 'ReactJS', 'Sass', 'Browserify', 'Parse', 'AWS/S3' ],
        role: 'All the things.',
        link: 'http://datafulme.herokuapp.com',
        images: [ imgRoot + '/datafulme1.png', imgRoot + '/datafulme2.png' ]
      },
      {
        categoryIndex: 0,
        name: 'Co-Decide',
        technologies: [ 'Javascript', 'BackboneJS', 'Sass', 'Ruby', 'Sinatra', 'Heroku' ],
        role: 'All the things.',
        link: 'http://codeci.de',
        images: [ imgRoot + '/codecide1.png', imgRoot + '/codecide2.png' ],
      },
      {
        categoryIndex: 0,
        name: 'This Code Portfolio',
        technologies: [ 'Javascript', 'ReactJS', 'AWS/S3' ],
        role: 'Author',
        link: window.location.href,
        images: [  ],
        repo: 'http://github.com/bbarr/replwithoutacause'
      },
      { 
        categoryIndex: 1,
        name: 'Fortress to Solitude',
        technologies: [ 'Javascript', 'SASS', 'Ruby', 'Sinatra', 'Heroku' ],
        role: 'Sole developer, full-stack. Worked closely with business owner, who also did most of the design work.',
        link: 'http://fortresstosolitude.com',
        images: [ imgRoot + '/fts1.png', imgRoot + '/fts2.png' ]
      },
      {
        categoryIndex: 2,
        name: 'decore.js',
        technologies: [ 'Javascript' ],
        role: 'Author',
        link: 'http://github.com/bbarr/decor',
        images: [  ]
      },
      { categoryIndex: 2,
        name: 'pointer.js',
        technologies: [ 'Javascript', 'ReactJS' ],
        role: 'Author',
        link: 'http://github.com/bbarr/pointer',
        images: [  ]
      }
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

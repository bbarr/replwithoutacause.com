
var ReactPointer = (function() {

var util = {

  changeDetectorMixin: {

    shouldComponentUpdate: function(props) {

      var pointerKeys = Object.keys(props).filter(function(k) { return k.charAt(0) === '$' })
      if (pointerKeys.length === 0) return true

      return pointerKeys.reduce(function(bool, key) {
        if (bool) return bool
        if (!props[key].isChanged) return bool
        return props[key].isChanged()
      }, false)
    }
  },


  pick: function(data, path, defaultish) {
    if (!data) return defaultish
    if (path.length == 0) return data
    var pathArray = (typeof path === 'string') ? path.split('.') : path
    var failed = false
    return pathArray.reduce(function(memo, segment) {
      if (failed) return defaultish
      var next = memo[segment]
      if (!next) failed = true
      return next
    }, data)
  },

  nest: function(path, nestee) {
    if (!path.length) return nestee
    var pathArray = (typeof path === 'string') ? path.split('.') : path
    var lastI = pathArray.length - 1
    var leadUp = pathArray.slice(0, lastI)
    var nestKey = pathArray[lastI]
    var base = {}
    var nestPoint = leadUp.reduce(function(memo, key, i) {
      return memo[key] = {}
    }, base)
    nestPoint[nestKey] = nestee
    return base
  }
}

var Pointer = function(data, cb) { 

  // all subs maintain closure link to "root"
  function subPointer(path) {

    return {

      _refresh: function() {
        var current = util.pick(root.data, path) 
        this._previous = this._current
        this._current = current
      },
      
      isChanged: function() { return this._previous !== this._current },

      refine: function(ext) {
        var newPath = path.concat(typeof ext == 'string' ? ext.split('.') : ext)
        var newPathString = newPath.join('.')
        var existing = root.subs[newPathString]
        var sub = existing || (root.subs[newPathString] = subPointer(newPath))
        !existing && sub._refresh()
        return sub
      },
      
      fromRoot: function(ext) {
        return root.refine(ext)
      },

      deref: function(orDefault) {
        return typeof this._current !== 'undefined' ? this._current : orDefault
      },

      update: function(delta) {
        var deltaForRoot = util.nest(path, delta)
        var newData = React.addons.update(root.data, deltaForRoot)
        root.swap(newData)
      },

      get: function(path) {
        return util.pick(this.deref(), path)
      },

      set: function(val) {
        return this.update({ $set: val })
      }
    }
  }

  // build root pointer, with extra magix
  var root = subPointer([])
  root._current = root.data = data
  root.subs = {}
  root.swap = function(newData) {
    root.data = newData
    root._refresh()
    Object.keys(this.subs).forEach(function(k) { root.subs[k]._refresh() })
    cb && cb()
  }
  
  return root
}

Pointer.util = util
return Pointer

})()

var mutate = require('xtend/mutable')
var assert = require('assert')
var xtend = require('xtend')

module.exports = Trie

// create a new trie
// null -> obj
function Trie () {
  if (!(this instanceof Trie)) return new Trie()
  this.trie = { nodes: {} }
}

// create a node on the trie at route
// and return a node
// str -> null
Trie.prototype.create = function (route) {
  assert.equal(typeof route, 'string', 'route should be a string')
  // strip leading '/' and split routes
  var routes = route.replace(/^\//, '').split('/')
  return (function createNode (index, trie) {
    var thisRoute = routes[index]

    if (thisRoute === undefined) return trie

    console.log('Recursively creating new node, because routes[' + index + '] is not undefined:', routes)
    var node = null
    if (/^:/.test(thisRoute)) {
      console.log('Route starts with :')
      // if node is a name match, set name and append to ':' node
      if (!trie.nodes['$$']) {
        console.log('Creating new node $$')
        node = { nodes: {} }
        trie.nodes['$$'] = node
      } else {
        console.log('Using existing node $$')
        node = trie.nodes['$$']
      }
      trie.name = thisRoute.replace(/^:/, '')
    } else if (!trie.nodes[thisRoute]) {
      console.log('Creating new node')
      node = { nodes: {} }
      trie.nodes[thisRoute] = node
    } else {
      console.log('Using existing node')
      node = trie.nodes[thisRoute]
    }

    // we must recurse deeper
    console.log('Recursing...')
    return createNode(index + 1, node)
  })(0, this.trie)
}

// match a route on the trie
// and return the node
// str -> obj
Trie.prototype.match = function (route) {
  assert.equal(typeof route, 'string', 'route should be a string')

  var routes = route.replace(/^\//, '').split('/')
  var params = {}

  var node = (function search (index, trie) {
    // either there's no match, or we're done searching
    if (trie === undefined) return undefined
    var thisRoute = routes[index]
    if (thisRoute === undefined) return trie

    if (trie.nodes[thisRoute]) {
      // match regular routes first
      return search(index + 1, trie.nodes[thisRoute])
    } else if (trie.name) {
      // match named routes
      params[trie.name] = decodeURIComponent(thisRoute)
      return search(index + 1, trie.nodes['$$'])
    } else {
      // no matches found
      return search(index + 1)
    }
  })(0, this.trie)

  if (!node) return undefined
  node = xtend(node)
  node.params = params
  return node
}

// mount a trie onto a node at route
// (str, obj) -> null
Trie.prototype.mount = function (route, trie) {
  assert.equal(typeof route, 'string', 'route should be a string')
  assert.equal(typeof trie, 'object', 'trie should be a object')

  var split = route.replace(/^\//, '').split('/')
  var node = null
  var key = null

  if (split.length === 1) {
    key = split[0]
    node = this.create(key)
  } else {
    var headArr = split.splice(0, split.length - 1)
    var head = headArr.join('/')
    key = split[0]
    node = this.create(head)
  }

  mutate(node.nodes, trie.nodes)
  if (trie.name) node.name = trie.name

  // delegate properties from '/' to the new node
  // '/' cannot be reached once mounted
  if (node.nodes['']) {
    Object.keys(node.nodes['']).forEach(function (key) {
      if (key === 'nodes') return
      node[key] = node.nodes[''][key]
    })
    mutate(node.nodes, node.nodes[''].nodes)
    delete node.nodes[''].nodes
  }
}

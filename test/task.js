'use strict'

require('./_common')
const assert = require('assert')

describe('Default', function() {

  it('without action', function() {
    wk.run('no_action')
  })

  it('with action setted later', function() {
    wk.run('action_later')
  })

  // it('must fail', function( done ) {
  //   wk.run('task_fail').catch(function(e) {
  //     assert.throws(
  //       () => { throw e },
  //       (err) => {
  //         if (err instanceof Error && /fail/.test(err)) {
  //           return true
  //         }
  //         return false
  //       }
  //     )
  //     done()
  //   })
  // })

})

describe('Serie', function() {

  it('must have the right values', function( done ) {

    wk.Tasks['serie0'].reenable()

    wk.Tasks['serie0'].promise.then(function(value) {
      assert.equal(wk.Tasks['task_sync'].value, 'task_sync:complete')
      assert.equal(wk.Tasks['task_async'].value, 'task_async:complete')
      assert.equal(value, 'serie0:complete')
      done()
    }).catch(function(err) {
      done(err)
    })

    wk.Tasks['serie0'].invoke()

  })

  it('must be executed in the right order', function( done ) {

    wk.Tasks['serie0'].reenable()

    // Executed in the right order
    let order = -1

    wk.Tasks['task_sync'] .promise.then(() => { order++; assert.equal(order, 0) })
    wk.Tasks['task_async'].promise.then(() => { order++; assert.equal(order, 1) })
    wk.Tasks['serie0']    .promise.then(() => {
      order++
      assert.equal(order, 2)
      done()
    })

    wk.Tasks['serie0'].invoke()

  })


})

describe('Parallel', function() {

  it('must have the right values', function( done ) {

    wk.Tasks['parallel0'].reenable()

    wk.Tasks['parallel0'].promise.then(function( value ) {
      assert.equal(wk.Tasks['task_sync'].value, 'task_sync:complete')
      assert.equal(wk.Tasks['task_async'].value, 'task_async:complete')
      assert.equal(wk.Tasks['task_sync_async'].value, 'task_sync_async:incomplete')
      assert.equal(value, 'parallel0:complete')
      done()
    }).catch(function(err) {
      done(err)
    })

    wk.Tasks['parallel0'].invoke()

  })

  it('must be executed after prerequisites', function( done ) {

    wk.Tasks['parallel0'].reenable()

    // Executed in the right order
    let count = 0

    wk.Tasks['task_sync']      .promise.then(() => { count++ })
    wk.Tasks['task_async']     .promise.then(() => { count++ })
    wk.Tasks['task_sync_async'].promise.then(() => { count++ })
    wk.Tasks['parallel0']      .promise.then(() => {
      assert.equal(count, 3)
      done()
    })

    wk.Tasks['parallel0'].invoke()

  })

})

describe('With parameters', function() {

  it('[CLI] Parameter', function( done ) {

    wk.exec('../bin/cli.js task_param John', { cwd: './test' }).then((res) => {
      assert.equal(res.stdout, "Hello John!\n")
      done()
    })

  })

  it('[CLI] Array', function( done ) {

    wk.exec('../bin/cli.js task_param2 -- [ John ]', { cwd: './test' }).then((res) => {
      assert.equal(res.stdout, "Hello John!\n")
      done()
    })

  })

  it('[CLI] Optional', function( done ) {

    wk.exec('../bin/cli.js task_param3 --name John', { cwd: './test' }).then((res) => {
      assert.equal(res.stdout, "Hello John!\n")
      done()
    })

  })

  it('[Code] Parameter', function( done ) {

    wk.Tasks['task_param'].argv._.push('John')

    wk.Tasks['task_param'].promise.then(( value ) => {
      assert.equal(value, "Hello John!")
      done()
    })

    wk.Tasks['task_param'].invoke()

  })

  it('[Code] Array', function( done ) {

    wk.Tasks['task_param2'].argv.task_param2 = {
      _: [ 'John' ]
    }

    wk.Tasks['task_param2'].promise.then(( value ) => {
      assert.equal(value, "Hello John!")
      done()
    })

    wk.Tasks['task_param2'].invoke()

  })

  it('[Code] Optional', function( done ) {

    wk.Tasks['task_param3'].argv.name = 'John'

    wk.Tasks['task_param3'].promise.then(( value ) => {
      assert.equal(value, "Hello John!")
      done()
    })

    wk.Tasks['task_param3'].invoke()

  })

})


describe('Errors', function() {
  // it('must throw', function() {

  //   assert.throws(
  //     () => {
  //       wk.run('error0')
  //     },
  //     Error
  //   )

  // })

  it('must be catched and finish operation', function( done ) {

    wk.run('error0').catch(function() {
      assert.equal(wk.Tasks['error0'].value, 'error0')
      done()
    })

  })
})
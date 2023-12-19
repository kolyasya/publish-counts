Package.describe({
  name: 'kolyasya:publish-counts',
  summary: 'Publish the count of a cursor, in real time or with pulling time',
  version: '1.0.0-beta.1',
  git: 'https://github.com/kolyasya/publish-counts.git',
  documentation: '../../../README.md',
});

Package.onUse(function (api, where) {
  api.versionsFrom('2.8.0');
  api.use('mongo', 'client');
  api.use('underscore', 'server');

  api.use(['ecmascript']);

  api.mainModule('client/publish-counts.js', 'client');
  api.mainModule('server/publish-counts.js', 'server');

  api.export('Counts');
  api.export('publishCount', 'server');
});

Package.onTest(function (api) {
  api.use([
    'kolyasya:publish-counts',
    'underscore',
    'tinytest',
    'mongo',
    'facts',
  ]);

  api.addFiles([
    'tests/helper.js',
    'tests/has_count_test.js',
    'tests/count_test.js',
    'tests/count_local_collection_test.js',
    'tests/count_non_reactive_test.js',
    'tests/count_from_field_shallow_test.js',
    'tests/count_from_field_fn_shallow_test.js',
    'tests/count_from_field_fn_deep_test.js',
    'tests/count_from_field_length_shallow_test.js',
    'tests/count_from_field_length_fn_shallow_test.js',
    'tests/count_from_field_length_fn_deep_test.js',
    'tests/field_limit_count_test.js',
    'tests/field_limit_count_from_field_test.js',
    'tests/field_limit_count_from_field_fn_test.js',
    'tests/field_limit_count_from_field_length_test.js',
    'tests/field_limit_count_from_field_length_fn_test.js',
    'tests/no_ready_test.js',
    'tests/no_warn_test.js',
    'tests/observe_handles_test.js',
  ]);
});

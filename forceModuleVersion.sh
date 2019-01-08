#!/bin/sh
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/core/decorators.metadata.json
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/core/plugin.metadata.json
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/core/util.metadata.json
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/core/ionic-native-plugin.metadata.json
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/core/index.metadata.json
sed -i .bak s/\"version\"\:4/\"version\"\:1/ node_modules/@ionic-native/ble/index.metadata.json


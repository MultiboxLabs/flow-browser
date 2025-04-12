// Copyright 2022 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export function assert(value,message){if(value){return}throw new Error("Assertion failed"+(message?`: ${message}`:""))}export function assertInstanceof(value,type,message){if(value instanceof type){return}throw new Error(message||`Value ${value} is not of type ${type.name||typeof type}`)}export function assertNotReached(message="Unreachable code hit"){assert(false,message)}
package com.github.asoee.cursorlessjetbrains.cursorless

import com.github.asoee.cursorlessjetbrains.sync.HatRange

interface HatUpdateCallback {
    fun onHatUpdate(hatRanges: Array<HatRange>)
}
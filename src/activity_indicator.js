function ActivityIndicator() {
    this.activityIndicatorStack = [];
    this.stackIndex = -1;
    
    /*--------------------------------------------------------------------------------------------*/

    this.indicatorCollect = [];
    
    this.pushStart = function(time, name) {
        var indicator = new OneActivityIndicator();
        indicator.activityName = name;
        indicator.startIndex = time;
        this.indicatorCollect.push(indicator);
    };

    this.pushEnd = function(time, name) {
        for (var i = this.indicatorCollect.length - 1; i >= 0; i--) {
            var indicator = this.indicatorCollect[i];
            if (indicator.activityName === name
                && indicator.endIndex === 0) {
                indicator.endIndex = time;
                return;
            }
        }
    
        var newIndicator = new OneActivityIndicator();
        newIndicator.activityName = name;
        newIndicator.endIndex = time;
        this.indicatorCollect.push(0, newIndicator);
    };
    
    /*--------------------------------------------------------------------------------------------*/
    
    this.analysis = function(globalStartTime, globalEndTime) {
        completeLackTime(globalStartTime, globalEndTime, this.indicatorCollect);
        correctData(this.indicatorCollect);
        flatData(this.indicatorCollect, this.flatIndicators);
        this.rebuildDataStructure();
    };
    
    /*-------------------------------------------------*/
    
    function completeLackTime(globalStartTime, globalEndTime, indicatorCollect) {
        var indicator = null;
        for (var i = 0; i < indicatorCollect.length; i++) {
            indicator = indicatorCollect[i];
            if (indicator.startIndex === 0) {
                indicator.startIndex = globalStartTime;
            } else {
                break;
            }
        }
    
        for (var j = 0; j < indicatorCollect.length; j++) {
            indicator = indicatorCollect[j];
            if (indicator.endIndex === 0) indicator.endIndex = globalEndTime;
        }
    }
    
    /*-------------------------------------------------*/

    function correctData(indicatorCollect) {
        for (var i = 0; i < indicatorCollect.length; i++) {
            var indicator = indicatorCollect[i];
    
            for (var j = i + 1; j < indicatorCollect.length; j++) {
                var another = indicatorCollect[j];
                if (another.startIndex > indicator.endIndex) break;
    
                if (another.endIndex > indicator.endIndex) {

                    var toAnotherTop = Math.abs(indicator.endIndex - another.startIndex);
                    var toAnotherBottom = Math.abs(indicator.endIndex - another.endIndex);

                    if ((j === i + 1) && (toAnotherTop < toAnotherBottom)) {
                        indicator.endIndex = another.startIndex;
                    } else {
                        indicator.endIndex = another.endIndex;
                        another.bind(indicator);
                    }

                    break;
                }
            }
        }
    }
    
    /*-------------------------------------------------*/
    
    this.flatIndicators = [];

    function flatData(indicatorCollect, flatIndicators) {
        for (var j = 0; j < indicatorCollect.length; j++) {
            var indicator = indicatorCollect[j];
            flatIndicators.push(new FlatIndicator(indicator, indicator.startIndex, true));
            flatIndicators.push(new FlatIndicator(indicator, indicator.endIndex, false));
        }

        flatIndicators.sort(function compare(o1, o2) {
            if (o1.time < o2.time) return -1; // time 从小到大排序
            if (o1.time > o2.time) return 1;
            return 0;
        });
    }
    
    /*-------------------------------------------------*/

    this.rebuildDataStructure = function() {
        for (var j = 0; j < this.flatIndicators.length; j++) {
            var flatIndicator = this.flatIndicators[j];
            var indicator = flatIndicator.indicator;

            if ((j + 1 < this.flatIndicators.length) && (this.flatIndicators[j + 1].time === flatIndicator.time)) {
                var sameTimeIndicators = this.findSameTimeIndicators(j, flatIndicator);
                var sameSize = sameTimeIndicators.length;

                // build same 成功的话，跳过这些，失败的话，按常规方案处理
                if (this.buildSameTimeList(sameTimeIndicators)) {
                    j += (sameSize - 1); // 外面本来就会+1
                    continue;
                }
            }

            if (this.flatIndicators[j].isStart) {
                this.buildStart(indicator.startIndex, indicator.activityName);
            } else {
                this.buildEnd(indicator.endIndex, indicator.activityName);
            }
        }
    };

    /*--------------------------------------------------------------------------------------------*/

    this.findSameTimeIndicators = function(i, flatIndicator) {
        var sameTimeIndicators = [];

        for (var j = i; j < this.flatIndicators.length; j++) {
            if (this.flatIndicators[j].time === flatIndicator.time) {
                sameTimeIndicators.push(this.flatIndicators[j]);
            } else {
                break;
            }
        }
        return sameTimeIndicators;
    };

    this.buildSameTimeList = function(sameTimeIndicators) {
        // 缓存修改，先不直接修改
        var stackIndexCopy = this.stackIndex;
        var orderedIndicators = [];

        // 按照栈的顺序反向找，填补结束时间，一直找到补料用完为止
        // 在end补料用完时，结束填补阶段
        // 当找到stackIndex = -1时，一定用完了end补料，最多一个start补料。否则构建失败
        // 如果此时还有一个start补料，直接buildStart
        for (var i = stackIndexCopy; i >= 0; i--) {
            if (this.isEndPatchUseUp(sameTimeIndicators)) {
                break;
            }

            var currentStack = this.activityIndicatorStack[i];
            var index = currentStack.length - 1;
            var currentStackEndActivity = currentStack[index];

            if (!currentStackEndActivity.isFinishTimeSet()) {
                var patch = this.findEndPatch(currentStackEndActivity.activityName, sameTimeIndicators);

                if (patch === null) continue;

                orderedIndicators.push(patch);
            }
        }

        if (sameTimeIndicators.length > 1) {
            return false;
        }

        if (sameTimeIndicators.length === 1) {
            if (!sameTimeIndicators[0].isStart) {
                return false;
            }
        }

        // 真正构建
        for (var k = 0; k<orderedIndicators.length; k++){
            this.buildEnd(orderedIndicators[k].time, orderedIndicators[k].indicator.activityName);
        }

        if (sameTimeIndicators.length === 1) {
            var indicator = sameTimeIndicators[0];
            this.buildStart(indicator.time, indicator.indicator.activityName);
        }

        return true;
    };

    this.isEndPatchUseUp = function(sameTimeIndicators) {
        return sameTimeIndicators.length === 0 ||
            (sameTimeIndicators.length === 1 && sameTimeIndicators[0].isStart);
    };

    this.findEndPatch = function(name, sameTimeIndicators) {
        for (var i = 0; i < sameTimeIndicators.length; i++) {
            var indicator = sameTimeIndicators[i];
            if (!indicator.isStart && (indicator.indicator.activityName === name)) {
                return sameTimeIndicators.splice(i,1)[0];
            }
        }
        return null;
    };

    /*-------------------------------------------------*/

    this.buildStart = function(index, activityName) {
        this.stackIndex++;

        this.chargeIndicatorStack(this.stackIndex + 1);
        var currentStack = this.activityIndicatorStack[this.stackIndex];

        var indicator = new OneActivityIndicator();
        indicator.activityName = activityName;
        indicator.startIndex = index;

        currentStack.push(indicator);
    };

    this.buildEnd = function(lineIndex, activityName) {
        if (this.stackIndex < -1) {
            return;
        }

        if (this.stackIndex === -1) {
            var indicator = new OneActivityIndicator();
            indicator.activityName = activityName;
            indicator.endIndex = lineIndex;

            var newStack = [];
            newStack.push(indicator);

            this.activityIndicatorStack.unshift(newStack);
        } else {
            var currentStack = this.activityIndicatorStack[this.stackIndex];
            var index = currentStack.length - 1;
            var currentActivity = currentStack[index];

            if(currentActivity.isFinishTimeSet()){
                this.stackIndex--;
                this.buildEnd(lineIndex, activityName);
            }else if (currentActivity.activityName === activityName) {
                currentActivity.endIndex = lineIndex;
                this.stackIndex--;
            }
        }
    };
    
    /*--------------------------------------------------------------------------------------------*/

    this.chargeIndicatorStack = function(targetSize) {
        var less = targetSize - this.activityIndicatorStack.length;
        if (less > 0) {
            for (var i = 0; i < less; i++) {
                this.activityIndicatorStack.push([]);
            }
        }
    }
}

function OneActivityIndicator() {
    this.activityName = "";
    this.startIndex = 0;
    this.endIndex = 0;

    this.bottomBindList = [];

    this.bind = function (indicator) {
        this.bottomBindList.push(indicator);
    };

    this.isFinishTimeSet = function () {
        return this.endIndex > 0;
    };

    this.setEnd = function (index) {
        this.endIndex = index;

        for (var i = 0;i<this.bottomBindList.length;i++) {
            this.bottomBindList[i].setEnd(index);
        }
    }
}

function FlatIndicator(indicator, time, isStart) {
    this.indicator = indicator;
    this.time = time;
    this.isStart = isStart;
}

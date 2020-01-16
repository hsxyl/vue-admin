<template>
    <div>
        <span class="demonstration">选择时间区间</span>
        <el-date-picker
                v-model="pickedDateTime"
                type="datetimerange"
                align="right"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="defaultTime"
                @change="pickTime">
        </el-date-picker>
        <div :id="chartId" style="width:100%; height: 400px;"/>
    </div>
</template>

<script>
    import echarts from 'echarts';
    import moment from 'moment'
    import {queryCowHeat,queryPredictHeat} from "../../api/api";
    import util from "../../common/js/util";
    import {formatDate} from "element-ui";

    const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
    const XAXIS_FORMAT = 'DD-HH';
    export default {
        name: "CowHeats",
        props: {
            cowId: {
                // type: Number,
                required: true
            }
        },
        data() {
            return {
                chartId: 'chart' + this.cowId,
                pickedDateTime: [moment().subtract(1, 'days').toDate(), moment().toDate()],
                defaultTime: "[" + moment().subtract(1, 'days').format(DEFAULT_DATE_FORMAT) + "," + moment().format(DEFAULT_DATE_FORMAT) + "]",
                cowHeat: [],
                predictNum: 5,
                predictCowHeat: [],
                beginTime: moment(),
                endTime: moment(),
                predictBeginTime: moment(),
                predictEndTime: moment(),
                duration: moment.duration({'hours': 2}),
            }
        },
        methods: {
            // 根据timePicked请求奶牛体温数据
            acquireCowHeat() {
                queryCowHeat({
                    cow_id: this.cowId,
                    begin_time: moment(this.pickedDateTime[0]).format(DEFAULT_DATE_FORMAT),
                    end_time: moment(this.pickedDateTime[1]).format(DEFAULT_DATE_FORMAT)
                }).then(resData => {
                    let {msg, code, data} = resData
                    if (code != 200) {
                        this.$message({
                            message: msg,
                            type: 'error'
                        });
                    } else {
                        this.cowHeat = data.heat_list//JSON.parse(data.heat_list);
                        this.beginTime = moment(data.begin_time,DEFAULT_DATE_FORMAT);
                        this.endTime = moment(data.end_time,DEFAULT_DATE_FORMAT);
                        // console.log("success to acquireCowheat,data.heat_list is "+this.cowHeat+
                        //     ",data.begin_time is "+data.begin_time+
                        //     ",data.end_time is "+data.end_time);
                        this.drawContainer();
                    }
                })
            },
            acquirePredictCowHeat() {
                queryPredictHeat({
                    'origin_value': this.cowHeat,
                    'predict_num': this.predictNum,
                    'begin_time': this.beginTime.format(DEFAULT_DATE_FORMAT)
                }).then(resData => {
                    let {msg, code, data} = resData;
                    if (code != 200) {
                        this.$message({
                            message: msg,
                            type: 'error'
                        });
                    } else {
                        this.predictCowHeat = data;
                        this.predictBeginTime = this.endTime.add(predictCowHeat);
                        this.predictEndTime = this.endTime.add(this.predictNum, 'h');
                    }
                })
            },
            drawContainer() {
                // this.acquireCowHeat();
                // this.acquirePredictCowHeat();
                this.containerColumn = echarts.init(document.getElementById(this.chartId));
                this.containerColumn.setOption({
                    title: {
                        text: '奶牛'
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    xAxis: {
                        type: 'category',
                        data: util.generateTimeSeiesByMoment(this.beginTime,this.endTime,this.duration).map(e=>e.format(XAXIS_FORMAT))

                        //+ util.generateTimeSeiesByMoment(this.predictBeginTime, this.predictEndTime, this.duration),//[1.1, 2.2, 3.3, 4.4, 5.5]
                    },
                    yAxis: {
                        max: 38,
                        min: 30,
                        splitLine: {
                            show: false
                        }
                    },
                    toolbox: {
                        left: 'center',
                        feature: {
                            dataZoom: {
                                yAxisIndex: 'none'
                            },
                            restore: {},
                            saveAsImage: {}
                        }
                    },
                    dataZoom: [
                        {startValue: util.countPointSumBetweenBeginEnd(this.beginTime,this.endTime,this.duration)
                         },
                    ],
                    visualMap: {
                        top: 101,
                        right: 52,
                        pieces: [{
                          gt: 33,
                          lte: 34,
                          color: '#061777',
                          label: '33-34°'
                        },
                        {
                            gt: 34,
                            lte: 35,
                            color: '#096',
                            label: '34-35°'
                        }, {
                            gt: 35,
                            lte: 36,
                            color: '#ffde33',
                            label: '35-36°'
                        }, {
                            gt: 36,
                            color: '#cc0033',
                            label: '>36°'
                        }],
                        outOfRange: {
                            color: '#999'
                        }
                    },
                    series: [
                        {
                            name: 'cow heat',
                            type: 'line',
                            data: (() => {
                                console.log('this:', this);
                                return this.cowHeat;})(),
                            // markPoint: {
                            //     itemStyle: {
                            //         normal: {
                            //             label: {
                            //                 show: true,
                            //                 formatter: function (param) {
                            //                     return 's' + param.value
                            //                 }
                            //             }
                            //         }
                            //     },
                            //     data: this.cowHeat+this.predictCowHeat
                            // }
                        },
                        {
                            name: 'predict heat',
                            type: 'line',
                            // data: [...Array(this.cowHeat.length)] + this.predictCowHeat,
                        }
                    ]
                });
                this.containerColumn.dispatchAction({
                    type: 'brush',
                    areas: [
                        {
                            brushType: 'lineX',
                            coordRange: [this.predictBeginTime.toDate(),this.predictEndTime.toDate()],
                        }
                    ]
                })
            },
            pickTime() {
                this.acquireCowHeat();
            }
        },
        mounted() {
            this.acquireCowHeat();
            this.drawContainer();
            // this.drawContainer(this.cowHeat)
        },
        updated() {
            // this.drawContainer(this.cowHeat)
        }
    }
</script>

<style scoped>

</style>
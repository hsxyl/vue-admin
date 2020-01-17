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
                predictNum: 3,
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
            acquireCowHeat(onRejected) {
                debugger
                queryCowHeat({
                    cow_id: this.cowId,
                    begin_time: moment(this.pickedDateTime[0]).format(DEFAULT_DATE_FORMAT),
                    end_time: moment(this.pickedDateTime[1]).format(DEFAULT_DATE_FORMAT)
                }).then(resData => {
                    let {msg, code, data} = resData
                    if (code != 200) {
                        debugger
                        this.$message({
                            message: msg,
                            type: 'error'
                        });
                    } else {
                        debugger
                        this.cowHeat = data.heat_list//JSON.parse(data.heat_list);
                        this.beginTime = moment(data.begin_time, DEFAULT_DATE_FORMAT);
                        this.endTime = moment(data.end_time, DEFAULT_DATE_FORMAT);
                        // console.log("success to acquireCowheat,data.heat_list is "+this.cowHeat+
                        //     ",data.begin_time is "+data.begin_time+
                        //     ",data.end_time is "+data.end_time);
                        // this.drawContainer();
                    }
                }).catch(resData => {
                    debugger
                    console.log(resData);
                })
            },
            acquirePredictCowHeat() {
                queryPredictHeat({
                    'origin_value': this.cowHeat,
                    'predict_num': this.predictNum,
                    'begin_time': this.beginTime.format(DEFAULT_DATE_FORMAT)
                }).then(resData => {
                    let {msg, code, data} = resData;
                    if (code !== 200) {
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
            acquireCowHeatAll() {
                let acquireCowHeat = queryCowHeat({
                    cow_id: this.cowId,
                    begin_time: moment(this.pickedDateTime[0]).format(DEFAULT_DATE_FORMAT),
                    end_time: moment(this.pickedDateTime[1]).format(DEFAULT_DATE_FORMAT)
                });
                let acquirePredicHeat = queryPredictHeat({
                    cow_id: this.cowId,
                    predict_num: this.predictNum,
                    begin_time: this.endTime.add(this.duration).format(DEFAULT_DATE_FORMAT)
                });
                this.$axios.all([acquireCowHeat, acquirePredicHeat])
                    .then(this.$axios.spread((res1, res2) => {
                        let data1 = res1.data;
                        let data2 = res2.data;
                        if (data1.code !== 200) {
                            this.$message({
                                message: data1.msg,
                                type: 'error'
                            })
                        } else {
                            this.cowHeat = data1.data.heat_list//JSON.parse(data.heat_list);
                            this.beginTime = moment(data1.data.begin_time, DEFAULT_DATE_FORMAT);
                            this.endTime = moment(data1.data.end_time, DEFAULT_DATE_FORMAT);
                        }
                        if (data2.code !== 200) {
                            this.$message({
                                message: data2.msg,
                                type: 'error'
                            })
                        } else {
                            this.predictCowHeat = data2.data.cow_heat;
                            this.predictBeginTime = moment(data2.data.begin_time, DEFAULT_DATE_FORMAT);
                            this.predictEndTime = moment(data2.data.end_time, DEFAULT_DATE_FORMAT);
                        }
                    })).then(() => {
                    this.drawContainer();
                });
            },
            drawContainer() {
                // this.acquireCowHeat();
                // this.acquireCowHeatAll()
                // await this.acquirePredictCowHeat();
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
                        data: util.generateTimeSeiesByMoment(this.beginTime, this.predictEndTime, this.duration).map(e => e.format(XAXIS_FORMAT))

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
                        {
                            startValue: util.countPointSumBetweenBeginEnd(this.beginTime, this.predictEndTime, this.duration)
                        },
                    ],
                    visualMap: {
                        top: 221,
                        right: 52,
                        pieces: [{
                            lte: 33,
                            color: '#cc0033',
                            label: '<33'
                        },
                            {
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
                            markArea: {
                                silent: true,
                                data: [[{xAxis: this.predictBeginTime.format(XAXIS_FORMAT)}, {xAxis: this.predictEndTime.format(XAXIS_FORMAT)}]]
                            },
                            data: this.cowHeat.concat(this.predictCowHeat),
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
                        // {
                        //     name: 'predict heat',
                        //     type: 'line',
                        //     // data: [...Array(this.cowHeat.length)] + this.predictCowHeat,
                        // }
                    ]
                });
                this.containerColumn.dispatchAction({
                    type: 'brush',
                    areas: [
                        {
                            brushType: 'lineX',
                            coordRange: ['17-06', '17-10'],
                        }
                    ]
                })
            },
            pickTime() {
                this.acquireCowHeatAll();
            }
        },
        mounted() {
            this.acquireCowHeatAll();
            // this.drawContainer();
            // this.drawContainer(this.cowHeat)
        },
        updated() {
            // this.drawContainer(this.cowHeat)
        }
    }
</script>

<style scoped>

</style>
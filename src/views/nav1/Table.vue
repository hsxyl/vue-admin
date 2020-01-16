<template>
	<section>
		<!--工具条-->
		<el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
			<el-form :inline="true" :model="filters">
				<el-form-item>
					<el-input v-model="filters.name" placeholder="姓名"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" v-on:click="getUsers">查询</el-button>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleAdd">新增</el-button>
				</el-form-item>
			</el-form>
		</el-col>

		<!--列表-->
		<el-table :data="cows" highlight-current-row v-loading="listLoading" @selection-change="selsChange" style="width: 100%;">
			<el-table-column type="selection" width="55">
			</el-table-column>
			<el-table-column type="index" width="60">
			</el-table-column>
			<el-table-column label="操作" width="150">
				<template scope="scope">
					<el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
					<el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
			<el-table-column prop="name" label="名字" width="120" sortable>
			</el-table-column>
			<el-table-column prop="old" label="年龄" width="100" sortable>
			</el-table-column>
			<el-table-column prop="catch_time" label="入场时间" width="230" sortable>
			</el-table-column>
			<el-table-column prop="weight" label="体重" width="120" sortable>
			</el-table-column>
			<el-table-column prop="is_heat" label="是否发情" min-width="180" :formatter="formatSex" sortable>
			</el-table-column>
			<el-table-column prop="breed_status" label="繁殖状态" min-width="180" :formatter="formatBreed">
			</el-table-column>

		</el-table>

		<!--工具条-->
		<el-col :span="24" class="toolbar">
			<el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
			<el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="20" :total="total" style="float:right;">
			</el-pagination>
		</el-col>

		<!--编辑界面-->
		<el-dialog title="编辑" v-model="editFormVisible" :close-on-click-modal="false">
			<el-form :model="editForm" label-width="80px" :rules="editFormRules" ref="editForm">
				<el-form-item label="名字" prop="name">
					<el-input v-model="editForm.name" auto-complete="off"></el-input>
				</el-form-item>
				<el-form-item label="是否发情">
					<el-radio-group v-model="editForm.is_heat">
						<el-radio class="radio" :label="true">是</el-radio>
						<el-radio class="radio" :label="false">否</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="年龄">
					<el-input-number v-model="editForm.old" :min="0" :max="50"></el-input-number>
				</el-form-item>
				<el-form-item label="入场时间">
					<el-date-picker type="date" placeholder="选择日期" v-model="editForm.catch_time"></el-date-picker>
				</el-form-item>
				<el-form-item label="体重">
					<el-input-number v-model="editForm.weight" precision="2" step="0.1" max="1000"></el-input-number>
				</el-form-item>
				<el-form-item label="繁殖状态">
					<el-select v-model="editForm.breed_status" placeholder="选择繁殖状态">
						<el-option v-for="item in breed_status" :key="item.value" :label="item.label" :value="item.value">
						</el-option>
					</el-select>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click.native="editFormVisible = false">取消</el-button>
				<el-button type="primary" @click.native="editSubmit" :loading="editLoading">提交</el-button>
			</div>
		</el-dialog>

		<!--新增界面-->
		<el-dialog title="新增" v-model="addFormVisible" :close-on-click-modal="false">
			<el-form :model="addForm" label-width="80px" :rules="addFormRules" ref="addForm">
				<el-form-item label="名字" prop="name">
					<el-input v-model="addForm.name" auto-complete="off"></el-input>
				</el-form-item>
				<el-form-item label="是否发情">
					<el-radio-group v-model="addForm.is_heat=false">
						<el-radio class="radio" :label="true">是</el-radio>
						<el-radio class="radio" :label="false">否</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="年龄">
					<el-input-number v-model="addForm.age" :min="0" :max="200"></el-input-number>
				</el-form-item>
				<el-form-item label="入场时间">
					<el-date-picker type="date" placeholder="选择日期" v-model="addForm.catch_time"></el-date-picker>
				</el-form-item>
				<el-form-item label="体重">
					<el-input-number v-model="addForm.weight = 100" precision="2" step="0.1" max="1000"></el-input-number>
				</el-form-item>
				<el-form-item label="繁殖状态">
					<el-select v-model="addForm.breed_status" placeholder="选择繁殖状态">
						<el-option v-for="item in breed_status" :key="item.value" :label="item.label" :value="item.value">
						</el-option>
					</el-select>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click.native="addFormVisible = false">取消</el-button>
				<el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
			</div>
		</el-dialog>
	</section>
</template>

<script>
	import util from '../../common/js/util'
	import NProgress from 'nprogress'
	import { getCowListPage, removeUser, batchRemoveUser, editUser, addUser } from '../../api/api';

	export default {
		data() {
			return {
				filters: {
					name: ''
				},
				cows: [],
				total: 0,
				page: 1,
				listLoading: false,
				sels: [],//列表选中列
				breed_status: [
					{value: 'NOTFERTILIZED',label: '未受精'},
					{value: 'LACTATION', label: '泌乳'},
					{value: 'NOMAL', label: '正常'}
				],


				editFormVisible: false,//编辑界面是否显示
				editLoading: false,
				editFormRules: {
					name: [
						{ required: true, message: '请输入姓名', trigger: 'blur' }
					]
				},
				//编辑界面数据
				editForm: {
					id: 0,
					name: '',
					is_heat: false,
					old: 0,
					birth: '',
					weight: '',
					breed_status: ''
				},

				addFormVisible: false,//新增界面是否显示
				addLoading: false,
				addFormRules: {
					name: [
						{ required: true, message: '请输入姓名', trigger: 'blur' }
					]
				},
				//新增界面数据
				addForm: {
					name: '',
					is_heat: false,
					old: 0,
					catch_time: '',
					weight: '',
					breed_status: ''
				}

			}
		},
		methods: {
			//性别显示转换
			formatSex: function (row, column) {
				return row.is_heat ? '是' : '否';
			},
			formatBreed: function(row) {
				switch (row.breed_status) {
					case 'NOTFERTILIZED':
						return '未受精'
					case 'LACTATION':
						return '泌乳'
					case 'NORMAL':
						return '正常'
					default:
						return '其他'
				}
			},
			handleCurrentChange(val) {
				this.page = val;
				this.getUsers();
			},
			//获取用户列表
			getUsers() {
				let para = {
					page_num: this.page,
					name: this.filters.name
				};
				this.listLoading = true;
				NProgress.start();
				getCowListPage(para).then((res) => {
					this.total = res.total;
					this.cows = res.data_list;
					this.listLoading = false;
					NProgress.done();
				});
			},
			//删除
			handleDel: function (index, row) {
				this.$confirm('确认删除该记录吗?', '提示', {
					type: 'warning'
				}).then(() => {
					this.listLoading = true;
					//NProgress.start();
					let para = {ids: [row.id].toString()};
					batchRemoveUser(para).then((res)=> {
						this.listLoading = false;
						this.$message({
							message: res.msg,
							type: res.code===200?'success':'error'
						});
						this.getUsers();
					}).catch(() => {});
				// 	removeUser(para).then((res) => {
				// 		this.listLoading = false;
				// 		//NProgress.done();
				// 		this.$message({
				// 			message: '删除成功',
				// 			type: 'success'
				// 		});
				// 		this.getUsers();
				// 	});
				// }).catch(() => {
				//
				// });
			})},
			//显示编辑界面
			handleEdit: function (index, row) {
				this.editForm = Object.assign({}, row);
				this.editFormVisible = true;
			},
			//显示新增界面
			handleAdd: function () {
				this.addFormVisible = true;
				this.addForm = {
					name: '',
					is_heat: false,
					age: 0,
					catch_time: '',
					weight: 100
				};
			},
			//编辑
			editSubmit: function () {
				this.$refs.editForm.validate((valid) => {
					if (valid) {
						this.$confirm('确认提交吗？', '提示', {}).then(() => {
							this.editLoading = true;
							//NProgress.start();
							let para = Object.assign({}, this.editForm);
							para.catch_time = (!para.catch_time || para.catch_time == '') ? '' : util.formatDate.format(new Date(para.catch_time), 'yyyy-MM-dd hh:mm:ss');
							editUser(para).then((res) => {
								this.editLoading = false;
								//NProgress.done();
								this.$message({
									message: res.msg,
									type: res.code===200?'success':'error'
								});
								this.$refs['editForm'].resetFields();
								this.editFormVisible = false;
								this.getUsers();
							});
						});
					}
				});
			},
			//新增
			addSubmit: function () {
				this.$refs.addForm.validate((valid) => {
					if (valid) {
						this.$confirm('确认提交吗？', '提示', {}).then(() => {
							this.addLoading = true;
							//NProgress.start();
							let para = Object.assign({}, this.addForm);
							para.catch_time = (!para.catch_time || para.catch_time == '') ? '' : util.formatDate.format(new Date(para.catch_time), 'yyyy-MM-dd hh:mm:ss');
							addUser(para).then((res) => {
								this.addLoading = false;
								//NProgress.done();
								this.$message({
									message: res.msg,
									type: res.code===200?'success':'error'
								});
								this.$refs['addForm'].resetFields();
								this.addFormVisible = false;
								this.getUsers();
							});
						});
					}
				});
			},
			selsChange: function (sels) {
				this.sels = sels;
			},
			//批量删除
			batchRemove: function () {
				var ids = this.sels.map(item => item.id).toString();
				this.$confirm('确认删除选中记录吗？', '提示', {
					type: 'warning'
				}).then(() => {
					this.listLoading = true;
					//NProgress.start();
					let para = { ids: ids };
					batchRemoveUser(para).then((res) => {
						this.listLoading = false;
						//NProgress.done();
						this.$message({
							message: res.msg,
							type: res.code===200?'success':'error'
						});
						this.getUsers();
					});
				}).catch(() => {

				});
			}
		},
		mounted() {
			this.getUsers();
		}
	}

</script>

<style scoped>

</style>
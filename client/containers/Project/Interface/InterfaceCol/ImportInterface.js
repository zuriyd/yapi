import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import {Icon, Select, Table, Tooltip} from 'antd';
import variable from '../../../../constants/variable';
import {connect} from 'react-redux';
import {fetchInterfaceListMenu} from '../../../../reducer/modules/interface.js';

const Option = Select.Option;

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      list: state.inter.list
    };
  },
  {
    fetchInterfaceListMenu
  }
)
export default class ImportInterface extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    selectedRowKeys: [],
    categoryCount: {},
    project: this.props.currProjectId
  };

  static propTypes = {
    list: PropTypes.array,
    selectInterface: PropTypes.func,
    projectList: PropTypes.array,
    currProjectId: PropTypes.string,
    fetchInterfaceListMenu: PropTypes.func
  };

  async componentDidMount() {
    // console.log(this.props.currProjectId)
    await this.props.fetchInterfaceListMenu(this.props.currProjectId);
  }

  // 切换项目
  onChange = async val => {
    this.setState({
      project: val,
      selectedRowKeys: [],
      categoryCount: {}
    });
    await this.props.fetchInterfaceListMenu(val);
  };

  datainit = list => {
    let reinitdata = list => {
      return list.map(item => {
          let node = {
            key: 'category_' + item._id,
            title: item.name,
            isCategory: true
          };
          let catChild = [];
          if (item.children) {
            catChild = reinitdata(item.children);
          }
          let intfChild = [];
          if (item.list) {
            intfChild = item.list.map(e => {
              e.key = e._id;
              e.categoryKey = 'category_' + item._id;
              e.categoryLength = item.list.length;
              return e;
            });
          }
          if (catChild.length > 0 || intfChild.length > 0) {
            node.children = [...catChild, ...intfChild]
          }
          return node;
        }
      )
    };
    let redata = reinitdata(list);
    //console.log(initialValue);

    return redata;
  };


  render() {
    const { list, projectList } = this.props;
    console.log({list});
    // const { selectedRowKeys } = this.state;


    // const data = list.map(item => {
    //   return {
    //     key: 'category_' + item._id,
    //     title: item.name,
    //     isCategory: true,
    //     children: item.list
    //       ? item.list.map(e => {
    //           e.key = e._id;
    //           e.categoryKey = 'category_' + item._id;
    //           e.categoryLength = item.list.length;
    //           return e;
    //         })
    //       : []
    //   };
    // });
    const data = this.datainit(list);

    const self = this;
    const rowSelection = {

      onSelect: (record, selected) => {
        // console.log(record, selected, selectedRows);
        const oldSelecteds = self.state.selectedRowKeys;
        const categoryCount = self.state.categoryCount;
        const categoryKey = record.categoryKey;
        const categoryLength = record.categoryLength;
        let selectedRowKeys = [];
        if (record.isCategory) {
          selectedRowKeys = record.children.map(item => item._id).concat(record.key);
          if (selected) {
            selectedRowKeys = selectedRowKeys
              .filter(id => oldSelecteds.indexOf(id) === -1)
              .concat(oldSelecteds);
            categoryCount[categoryKey] = categoryLength;
          } else {
            selectedRowKeys = oldSelecteds.filter(id => selectedRowKeys.indexOf(id) === -1);
            categoryCount[categoryKey] = 0;
          }
        } else {
          if (selected) {
            selectedRowKeys = oldSelecteds.concat(record._id);
            if (categoryCount[categoryKey]) {
              categoryCount[categoryKey] += 1;
            } else {
              categoryCount[categoryKey] = 1;
            }
            if (categoryCount[categoryKey] === record.categoryLength) {
              selectedRowKeys.push(categoryKey);
            }
          } else {
            selectedRowKeys = oldSelecteds.filter(id => id !== record._id);
            if (categoryCount[categoryKey]) {
              categoryCount[categoryKey] -= 1;
            }
            selectedRowKeys = selectedRowKeys.filter(id => id !== categoryKey);
          }
        }
        self.setState({ selectedRowKeys, categoryCount });
        self.props.selectInterface(
          selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
          self.state.project
        );
      },
      onSelectAll: selected => {
        // console.log(selected, selectedRows, changeRows);
        let selectedRowKeys = [];
        let categoryCount = self.state.categoryCount;
        if (selected) {
          data.forEach(item => {
            if (item.children) {
              categoryCount['category_' + item._id] = item.children.length;
              selectedRowKeys = selectedRowKeys.concat(item.children.map(item => item._id));
            }
          });
          selectedRowKeys = selectedRowKeys.concat(data.map(item => item.key));
        } else {
          categoryCount = {};
          selectedRowKeys = [];
        }
        self.setState({ selectedRowKeys, categoryCount });
        self.props.selectInterface(
          selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
          self.state.project
        );
      },
      selectedRowKeys: self.state.selectedRowKeys
    };

    const columns = [
      {
        title: '接口名称',
        dataIndex: 'title',
        width: '30%'
      },
      {
        title: '接口路径',
        dataIndex: 'path',
        width: '40%'
      },
      {
        title: '请求方法',
        dataIndex: 'method',
        render: item => {
          let methodColor = variable.METHOD_COLOR[item ? item.toLowerCase() : 'get'];
          return (
            <span
              style={{
                color: methodColor.color,
                backgroundColor: methodColor.bac,
                borderRadius: 4
              }}
              className="colValue"
            >
              {item}
            </span>
          );
        }
      },
      {
        title: (
          <span>
            状态{' '}
            <Tooltip title="筛选满足条件的接口集合">
              <Icon type="question-circle-o" />
            </Tooltip>
          </span>
        ),
        dataIndex: 'status',
        render: text => {
          return (
            text &&
            (text === 'done' ? (<span className="tag-status done">已发布</span>
                ) : (text === 'undone' ? (<span className="tag-status undone">开发中</span>
                    ) : (text === 'testing' ? (<span className="tag-status testing">已提测</span>
                        ) : (text === 'design' ? (<span className="tag-status design">设计中</span>
                            ) : (text === 'stoping' ? (<span className="tag-status stoping">暂停开发</span>
                                ) : (<span className="tag-status deprecated">已过时</span>
                                )
                            )
                        )
                    )
                )
            )
          );
        },
        filters: [
          {
            text: '已发布',
            value: 'done'
          },
          {
            text: '设计中',
            value: 'design'
          },
          {
            text: '开发中',
            value: 'undone'
          }, {
            text: '已提测',
            value: 'testing'
          }, {
            text: '暂停开发',
            value: 'stoping'
          },
          {
            text: '已过时',
            value: 'deprecated'
          }
        ],
        onFilter: (value, record) => {
          let arr = record.children.filter(item => {
            return item.status.indexOf(value) === 0;
          });
          return arr.length > 0;
          // record.status.indexOf(value) === 0
        }
      }
    ];

    return (
      <div>
        <div className="select-project">
          <span>选择要导入的项目： </span>
          <Select value={this.state.project} style={{ width: 200 }} onChange={this.onChange}>
            {projectList.map(item => {
              return item.projectname ? (
                ''
              ) : (
                <Option value={`${item._id}`} key={item._id}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </div>
        <Table columns={columns} rowSelection={rowSelection} dataSource={data} pagination={false} />
      </div>
    );
  }
}

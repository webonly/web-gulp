/*!
 * NavigationService v2.1.0 
 * Copyright 2016-2018 HIT ROBOT GROUP 
 * Date: 2017-1-23 14:01:30  WZB
 * 
 */

(function (factory) {
    this.NavigationService= factory();
})(function () {
	function NavigationService (){
    /**
     * 接口版本信息
     */
    this.version='v2.1.0';
    var Ros=null,
        MapEditMessage=null,
        MapEditDiv,
        MapEditCanvas,
        scrollSize,
        scrollSizeTop=0,
        scrollSizeLeft=0,
        goalPose,
    /**
     * cmdTopic 发送的Msg
     * 
     */
    CmdEnum= {
        Navigation: "navigation",       //切换导航模式（命令/状态）
        Gmapping: "gmapping",           //切换建图模式（命令/状态）              
        Coverting: "converting",        //导航切换状态（状态）  
        Cancel: "cancel",               //取消导航 (命令)
        GamppingPose: "gmapping_pose",  //建图保存地图前发送 (命令)
        SaveMap: "save_map",            //保存地图map （命令/状态）
        SaveMapEdit: "save_map_edit",   //保存地图map_edit（命令/状态）
        SaveAsMap: "save_as_map",       //保存修改地图map（命令/状态）
        SaveAsMapEdit: "save_as_map_edit", //保存地图map_edit（命令/状态）
        Userauth: "user_auth",             //获取底盘类型名称(命令)
        Map_Select: "dbparam-select",      //查询已创建的场景地图名称集合,序列排在第一是当前场景地图dbparam:..
        Map_Delete: "dbparam-delete",      //删除地图
        Map_Update: "dbparam-update",      //切换地图
        Map_Insert: "dbparam-insert",      //添加地图
        Update: "update",                  //软件更新-
        Roslog_delete: "roslog-delete",    //查询日志-
        Roslog_select: "roslog-select",    //删除日志-
        Shutdown:"shutdown",               //关机
        Reboot:"reboot",                   //重启
        Version: "version"                 //获取版本信息
        },
    /**
     * shellTopic 发送的Msg
     */
    ShellEnum={
        ChargeUp: 'rostopic pub -1 /auto_charge std_msgs/Byte "1"',
        ChargeDown: 'rostopic pub -1 /auto_charge std_msgs/Byte "0"',
        Joystick: '_JOYSTICK=`rosnode list | grep teleop_joystic`; if [[ -n $_JOYSTICK ]]; then _FB="joy_on"; else _FB="joy_off"; fi; rostopic pub -1 /shell_feedback std_msgs/String $_FB',
        JoystickOn: 'roslaunch bringup teleop_joystick.launch',
        JoystickOff: 'rosnode kill /teleop_joystick',
        MapSaveStaus: 'roslaunch bringup map_edit_as_saver.launch; rostopic pub -1 /shell_feedback std_msgs/String "map_edit_ok"',
        PLCopen: "rostopic pub -1 /waypoint_user_pub std_msgs/String \"wangjin_open\"",
        PLCclose: "rostopic pub -1 /waypoint_user_pub std_msgs/String \"wangjin_close\"",
        PLCstatus: "rostopic pub -1 /waypoint_user_pub std_msgs/String \"wangjin_status\"",
        Version: "_RC=`grep \'\\\'\'|\'\\\'\' ~/catkin_ws/README.md`;_FB=`echo $_RC | awk -F \'\\\'\'|\'\\\'\' \'\\\'\'{print $10}\'\\\'\'`;_FB=`echo version:$_FB | awk -F \'\\\'\' \'\\\'\' \'\\\'\'{print $1$2}\'\\\'\'`;rostopic pub -1 /shell_feedback std_msgs/String $_FB;unset _FB; unset _RC;"
        },
    /**
     *Topic 类型
     */
    TopicEnum={
        cmdTopic: { name: '/cmd_string', messageType: "std_msgs/String" },  //cmd Topic 
        shellTopic: { name: '/shell_string', messageType: "std_msgs/String" },
        updateTopic: { name: '/system_shell/shell_string', messageType: "std_msgs/String" },
        imuTopic: { name: '/mobile_imu', messageType: "sensor_msgs/Imu" },
        velTopic: { name: '/cmd_vel', messageType: "geometry_msgs/Twist" },
        odomTopic: { name: '/odom', messageType: "nav_msgs/Odometry" },
        poseTopic: { name: '/robot_pose', messageType: "geometry_msgs/Pose" },
        diagnosticsTopic: { name: '/diagnostics_agg', messageType: "diagnostic_msgs/DiagnosticArray" },
        map_editTopic: { name: '/map_edit', messageType: "nav_msgs/OccupancyGrid" },
        map_edit_asTopic: { name: '/map_edit_as', messageType: "nav_msgs/OccupancyGrid" },
        waypointTopic: { name: '/waypoints', messageType: "yocs_msgs/WaypointList" },
        trajectoryTopic: { name: '/trajectories', messageType: "yocs_msgs/TrajectoryList" },
        waypoint_addTopic: { name: '/waypoint_add', messageType: "yocs_msgs/Waypoint" },
        waypoint_removeTopic: { name: '/waypoint_remove', messageType: "yocs_msgs/Waypoint" },
        trajectory_addTopic: { name: '/trajectory_add', messageType: "yocs_msgs/Trajectory" },
        trajectory_removeTopic: { name: '/trajectory_remove', messageType: "yocs_msgs/Trajectory" },
        nav_ctrlTopic: { name: '/nav_ctrl', messageType: "yocs_msgs/NavigationControl" },
        nav_ctrl_statusTopic: { name: '/nav_ctrl_status', messageType: "yocs_msgs/NavigationControlStatus" },
        shell_feedbackTopic: { name: '/shell_feedback', messageType: "std_msgs/String" }
        },
    /**
     * 导航模式
     */
    NavigationModeEnum={
        Navigation: "navigation",
        Gmapping: "gmapping",
        Coverting: "converting"
        },
    /**
     * 路点列表
     */
    WaypointList=new Array(),
    /**
     *轨迹列表
     */
    TrajectoryList=new Array(),
    /**
     *当前导航状态 {string } 导航/建图/切换 NavigationModeEnum
     */
    NavigationMode=null,
    /**
     *当前Waypoint/Trajectory的标记名称
     */
    CurrentPositionName="",
    /**
     *手动控制定时器
     */
    Timer=null,
    /**
     *无
     */
    actionClient=function () {
        return new ROSLIB.ActionClient({
            ros: Ros,
            actionName: 'move_base_msgs/MoveBaseAction',
            serverName: '/move_base'
        });
    },
    /**
     *构造Msg
     *@data {string} CmdEnum/ShellEnum的值
     */
    Msg=function (data) {
        return new ROSLIB.Message({
            data: data
        });
    },
    /**
     *地图信息
     *@info {object} 地图头信息 包括长、宽
     *@data {Array}  地图各像素值
     */
    MapMessage=function (info, data) {
        return new ROSLIB.Message({
            header: {
                frame_id: "/map",
                seq: 0
            },
            info: info,
            data: data
        });
    },
    /**
     *构造坐标点信息(原点w为1其他为0)
     *@posX {number}  距离原点的水平距离  
     *@posY {number}  距离原点的垂直距离
     *@oriZ {number}  角度
     *@oriW {number}  角度
     */
    Pose=function (posX,posY,oriZ,oriW) {
        return new ROSLIB.Pose({
            position: { x: posX, y: posY, z: 0.0 },
            orientation: { x: 0.0, y: 0.0, z: oriZ, w: oriW }
        })
    },
    /**
     *目标点控制器
     *@pose {object} 目标坐标点  
     */
    Goal=function (pose) {
        return new ROSLIB.Goal({
            actionClient: actionClient(),
            goalMessage: {
                target_pose: {
                    header: {
                        frame_id: '/map'
                    },
                    pose: pose
                }
            }
        });
    },
    /**
     *构造Waypoints信息
     *@name         {string} waypoint 标记名  
     *@pose         {object} 坐标点 
     *@radius       {number} 半径 
     *@timeout      {number} 超时时间 单位 MS 
     *@keep         {string} 未能正常到达目标点后动作 LOOP 再一次尝试 NONE 不再尝试
     *@mode         {string} 参考WaypointMode说明 
     */
    WaypointMessage=function (name, pose, radius, timeout, keep, mode) {
        return new ROSLIB.Message({
            header: {
                frame_id: mode,
            },
            close_enough: radius,
            goal_timeout: timeout,
            failure_mode: keep,
            name: name,
            pose: pose,
        });
    },
    /**
     *构造Trajectory信息
     *@name         {string} trajectory 标记名  
     *@waypoints    {Array} waypoint集合 
     */
    TrajectoryMessage=function (name, waypoints) {
        return new ROSLIB.Message({
            name: name,
            waypoints: waypoints
        });
    },
    /**
     *构造Waypoint与Trajectory的控制信息
     *@control      {number} 1:启动 2:停止
     *@goal_name    {string} 需要执行的waypoint/trajectory标记名
   */
    NavCtrlMessage=function (control, goal_name) {
        return new ROSLIB.Message({
            control: control,
            goal_name: goal_name
        });
    },
    /**
     *构造速度信息
     *@linear_x      {number} 线速度
     *@angular_z     {number} 角速度
     */
    TwistMessage=function (linear_x, angular_z) {
        return new ROSLIB.Message({
            linear: {
                x: linear_x,
                y: 0,
                z: 0
            },
            angular: {
                x: 0,
                y: 0,
                z: angular_z
            },
        });
    },
    /**
     *构建Topic
     *@option   {object} TopicEnum的值
     */
    Topic=function (option) {
        return new ROSLIB.Topic({
            ros: Ros,
            name: option.name,
            messageType: option.messageType
        });
    },
    /**
     *发布Topic
     *@topic    {object}    TopicEnum类型
     *@data     {string}    CmdEnum/ShellEnum类型,支持多个参数
     */
    Publish=function (topic, data) {
        var topic = Topic(topic);
        for (var i = 1; i < arguments.length; i++) {
            var msg = Msg(arguments[i]);
            topic.publish(msg);
        }
    },
     /**
     *发布Topic 任意消息
     *@topic    {object}    TopicEnum类型
     *@data     {object}    例如 Msg、WaypointMessage
     */
    TPublish=function (topic, data) {
        topic.publish(data);
    };
    /**
     * 建图原点坐标
     */
    this.startPostion=Pose(0,0,0,1);
    /**
     * 导航状态切换属性
     */
    this.navModeStatus=NavigationModeEnum;
    this.navModeStatus.navStatus="/Other/ros_mode";



    /**
     *Websocket初始化
     *@option      {object} option.url:服务器地址 option.onopen:连接成功回调 option.onclose:连接关闭回调 option.onerror:连接错误回调
     */
    this.Init=function (option) {
        var url = option.url || "ws://" + window.location.hostname + ":9090";
        Ros = new ROSLIB.Ros();
        Ros.connect(url);
        Ros.on('connection', option.onopen || function () {
            console.log("connect server %s success", url);
        });
        Ros.on('close', option.onclose || function () {
            console.error("connect server %s close", url);
        });
        Ros.on('error', option.onerror || function () {
            console.error("connect server %s error", url);
        });
    };
    /**
     *显示地图
     *@width  {number}  画布宽度
     *@height {number}  画布高度
     *@div    {string}  画布父容器ID
     */
    this.ShowMap=function (width, height,divID) {
        document.getElementById(divID).innerHTML="";
        var viewer = new ROS2D.Viewer({
            divID: divID,
            width: width,
            height: height,
            background: "#7e7e7e"
        });
        var nav = NAV2D.OccupancyGridClientNav({
            ros: Ros,
            rootObject: viewer.scene,
            continuous: true,
            withOrientation: true,
            viewer: viewer,
            serverName: '/move_base'
        });
        return viewer.scene;
    };
    /**
     *移除地图
     *@div    {string}  画布父容器ID
     */
    this.RemoveMap=function (divID) {
        document.getElementById(divID).innerHTML="";
    };
    /**
     *切换至建图模式
     */
    this.Gmapping=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Gmapping);
    };
    /**
     *切换至导航模式
     */
    this.Navigation=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Navigation);
    };
    /**
     *保存建好的地图
     */
    this.SaveMap=function () {
        Publish(TopicEnum.cmdTopic,CmdEnum.GamppingPose, CmdEnum.SaveMap , CmdEnum.SaveMapEdit);
    };
    /**
     * 显示修改地图
     */
    this.ShowMapEdit=function(divID,canvasID){
           MapEditDiv=divID;
           MapEditCanvas=canvasID;
           mapEditdiv=document.getElementById(MapEditDiv);
           mapEditdiv.style.overflow="auto";
           var map_editTopic = Topic(TopicEnum.map_editTopic);
           map_editTopic.subscribe(function(message){
           MapEditMessage = message;
           map_editTopic.unsubscribe();
            var canvas =  document.getElementById(MapEditCanvas);
            var context = canvas.getContext('2d');
            canvas.width = message.info.width;
            canvas.height = message.info.height;
            var imageData = context.createImageData(canvas.width, canvas.height);
            for (var row = 0; row < canvas.height; row++) {
                for (var col = 0; col < canvas.width; col++) {
                    var mapI = col + ((canvas.height - row - 1) * canvas.width);
                    var data = message.data[mapI];
                    var val;
                    if (data === 100) {
                        val = 0;
                    } else if (data === 0) {
                        val = 255;
                    } else {
                        val = 127;
                    }
                    var i = (col + (row * canvas.width)) * 4;
                    // r
                    imageData.data[i] = val;
                    // g
                    imageData.data[++i] = val;
                    // b
                    imageData.data[++i] = val;
                    // a
                    imageData.data[++i] = 255;
                }
            }
            context.putImageData(imageData, 0, 0);
        });
    };
    /**
     * 保存修改地图
     */
    this.SaveMapEdit=function(){
          mapEditCanvas=document.getElementById(MapEditCanvas);
          var MapEditArray = new Array(),
          cxtMap = mapEditCanvas.getContext("2d"),
          canvas = mapEditCanvas,
          imgData = cxtMap.getImageData(0, 0, canvas.width, canvas.height);
          for (var row = 0; row < canvas.height; row++) {
            for (var col = 0; col < canvas.width; col++) {
                var j = col + ((canvas.height - row - 1) * canvas.width);
                var i = (col + (row * canvas.width)) * 4;
                switch (imgData.data[i]) {
                  case 0:
                    MapEditArray[j] = 100;
                    break;
                  case 255:
                    MapEditArray[j] = 0;
                    break;
                  case 127:
                    MapEditArray[j] = -1;
                    break;
                  default:
                    MapEditArray[j] = 100;
                    break;
                }
            }
       }
        Publish(TopicEnum.cmdTopic, CmdEnum.SaveAsMapEdit);
        var msg = MapMessage(MapEditMessage.info, MapEditArray);
        var mapeditastopic = Topic(TopicEnum.map_edit_asTopic);
        mapeditastopic.publish(msg);
    };
    /******************************  轨迹操作未开放  ******************************/
    // /**
    //  *站点添加
    //  *@wapoint {object} 站点信息 WaypointMessage
    //  */
    // this.WayPointAdd=function (waypoint) {
    //     var topic = Topic(TopicEnum.waypoint_addTopic);
    //     topic.publish(waypoint);
    // },
    // /**
    //  *站点删除
    //  *@wapoint {object} 站点信息 WaypointMessage
    //  */
    // this.WayPointRemove=function (waypoint) {
    //     var topic = Topic(TopicEnum.waypoint_removeTopic);
    //     topic.publish(waypoint);
    // };
    // *
    //  *轨迹添加
    //  *@trajectory {object} 站点信息 TrajectoryMessage
     
    // this.TrajectoryAdd=function (trajectory) {
    //     var topic = Topic(TopicEnum.trajectory_addTopic);
    //     topic.publish(waypoint);
    // };

    // /**
    //  *轨迹删除
    //  *@trajectory {object} 站点信息 TrajectoryMessage
    // */
    // this.TrajectoryRemove=function (trajectory) {
    //     var topic = Topic(TopicEnum.trajectory_removeTopic);
    //     topic.publish(waypoint);
    // };

    /**
     * 单点运动 导航至指定地点
     * @pose            {Pose}      坐标点
     * @goalCallback    {Fuction}           
     */
    this.goPostion=function (pose, goalCallback) {
        goalPose = Goal(pose);
        goalPose.send();
        goalPose.on('status', goalCallback);
    };
    /**
     * 取消订阅导航结果状态
     */
    this.UnSubscribeGoal=function(goalCallback){
        goalPose.off('status', goalCallback);
    };
    /**
     *取消当前导航指令（停止）
     */
    this.Cancel=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Cancel);
    };
    /**
     *前进
     */
    this.goFront=function () {
        var velTopic = Topic(TopicEnum.velTopic);
        if (Timer != null) {
            clearInterval(Timer);
            Timer = null;
        }
        Timer = setInterval(function () {
            velTopic.publish(TwistMessage(0.25, 0));
        }, 300);
    };
    /**
     *后退
     */
    this.goBack=function () {
        var velTopic = Topic(TopicEnum.velTopic);
        if (Timer != null) {
            clearInterval(Timer);
            Timer = null;
        }
        Timer = setInterval(function () {
            velTopic.publish(TwistMessage(-0.25, 0));
        }, 300);
    };
    /**
     *左转
     */
    this.goLeft=function () {
        var velTopic = Topic(TopicEnum.velTopic);
        if (Timer != null) {
            clearInterval(Timer);
            Timer = null;
        }
        Timer = setInterval(function () {
            velTopic.publish(TwistMessage(0, 0.25));
        }, 300);
    };
    /**
     *右转
     */
    this.goRight=function () {
        var velTopic = Topic(TopicEnum.velTopic);
        if (Timer != null) {
            clearInterval(Timer);
            Timer = null;
        }
        Timer = setInterval(function () {
            velTopic.publish(TwistMessage(0, -0.25));
        }, 300);
    },
    /**
     *停止
     */
    this.goStop=function () {
        var velTopic = Topic(TopicEnum.velTopic);
        if (Timer != null) {
            clearInterval(Timer);
            Timer = null;
        }
        velTopic.publish(TwistMessage(0, 0));
    };
    /**
     *全局订阅回调
     */
    this.Subscribe_feedbackTopic=function (callback) {
    	var shell_feedbackTopic = Topic(TopicEnum.shell_feedbackTopic);
        shell_feedbackTopic.subscribe(callback);
    };

    /**
     *位置坐标订阅回调
     */
    var poseTopic;
    this.Subscribe_poseTopic=function (callback) {
         poseTopic = Topic(TopicEnum.poseTopic);
         poseTopic.subscribe(callback);
    };
    /**
     *取消位置坐标订阅
     */
    this.UnSubscribe_poseTopic=function () {
         poseTopic.unsubscribe();
    };
    /**
     *诊断信息订阅（获取导航状态信息）
     */
    var diagnosticsTopic;
    this.Subscribe_diagnosticsTopic=function (callback) {
    	 diagnosticsTopic = Topic(TopicEnum.diagnosticsTopic);
         diagnosticsTopic.subscribe(callback);
    };
    /**
     *取消诊断信息订阅（获取导航状态信息）
     */
    this.UnSubscribe_diagnosticsTopic=function () {
        diagnosticsTopic.unsubscribe();
    };
    /******************************  多场景操作未开放  ******************************/
    // /**
    //  *搜索已创建的场景地图
    //  */
    // this.SearchMap=function(){
    //     var topic = Topic(TopicEnum.cmdTopic);
    //     var msg=Msg(CmdEnum.Map_Select);
    //     topic.publish(msg);
    // };
    // /**
    //  *添加场景地图
    //  */
    // this.Map_Insert=function(){
    //     var topic = Topic(TopicEnum.cmdTopic);
    //     var msg=Msg(CmdEnum.Map_Insert);
    //     topic.publish(msg);
    // };
    // *
    //  *删除已创建的场景地图
     
    // this.DeleteMap=function(mapname){
    //     var topic = Topic(TopicEnum.cmdTopic);
    //     var msg=Msg(CmdEnum.Map_Delete+":"+mapname);
    //     topic.publish(msg);
    // };

    // /**
    //  *切换已创建的场景地图
    //  */
    // this.MapUpdate=function(){
    //     var topic = Topic(TopicEnum.cmdTopic);
    //     var msg=Msg(CmdEnum.Map_Update);
    //     topic.publish(msg);
    // };
    /**
     *开启手柄
     */
    this.OpenHandle=function () {
        Publish(TopicEnum.shellTopic, ShellEnum.JoystickOn, ShellEnum.Joystick);
    };
    /**
     *关闭手柄
     */
    this.CloseHandle=function () {
        Publish(TopicEnum.shellTopic, ShellEnum.JoystickOff, ShellEnum.Joystick);
    };
    /**
     *开启手柄
     */
    this.GetHandleStatus=function () {
        Publish(TopicEnum.shellTopic, ShellEnum.Joystick);
    };
    /**
     *关机
     */
    this.Shutdown=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Shutdown);
    };
    /**
     *重启
     */
    this.Reboot=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Reboot);
    };
    /**
     *获取版本信息
     */
    this.Version=function () {
        Publish(TopicEnum.cmdTopic, CmdEnum.Version);
    };
    /**
     * 地图修改固定画布
     */
    this.FixCanvas=function(){
        document.getElementById(MapEditDiv).style.overflow="hidden";
    };
    /**
     * 地图修改取消固定画布
     */
    this.UnFixCanvas=function(){
        document.getElementById(MapEditDiv).style.overflow="auto";
    };
    /**
     * 地图修改画笔工具
     */
    this.Paint = {
        init: function () {
            this.x = [];//移动时的X坐标
            this.y = [];//移动时的Y坐标
            this.clickDrag = [];
            this.lock = false;//移动前，判断是否按下
            this.storageColor = "#000000";
            this.eraserRadius = 10;
            this.canvas = document.getElementById(MapEditCanvas);
            this.cxt = this.canvas.getContext('2d');
            this.cxt.lineJoin = "round";//context.lineJoin - 指定两条线段的连接方式
            this.cxt.lineWidth = 6;//线条的宽度
            this.w = this.canvas.width;
            this.h = this.canvas.height;
            this.touch = ("createTouch" in document);//判定是否为触屏
            this.StartEvent = this.touch ? "touchstart" : "mousedown";//机器人触摸屏和本地调试兼容
            this.MoveEvent = this.touch ? "touchmove" : "mousemove";
            this.EndEvent = this.touch ? "touchend" : "mouseup";
            this.bind();
            scrollSize=document.getElementById(MapEditDiv);
            scrollSize.onscroll=function(){
            scrollSizeTop=scrollSize.scrollTop;
            scrollSizeLeft=scrollSize.scrollLeft;
                }
            },
            bind: function () {
                var t = this;
                this.canvas['on' + t.StartEvent] = function (e) {
                    var touch = t.touch ? e.touches[0] : e;
                    var _x = touch.clientX - touch.target.offsetLeft+scrollSizeLeft;//画布上的x坐标，以画布左上角为起点
                    var _y = touch.clientY - touch.target.offsetTop+scrollSizeTop;//画布上的y坐标，以画布左上角为起点             
                    if (t.isEraser) {
                        t.resetEraser(_x, _y, touch);
                    } else {
                        t.movePoint(_x, _y);//记录移动位置
                        t.drawPoint();//绘制路线
                    }
                    t.lock = true;
                };
                /*移动事件*/
                this.canvas['on' + t.MoveEvent] = function (e) {
                    var touch = t.touch ? e.touches[0] : e;
                    if (t.lock)//t.lock为true则执行
                    {
                        var _x = touch.clientX - touch.target.offsetLeft+scrollSizeLeft;//画布上的x坐标，以画布左上角为起点
                        var _y = touch.clientY - touch.target.offsetTop+scrollSizeTop;//画布上的y坐标，以画布左上角为起点
                        if (t.isEraser) {
                            t.resetEraser(_x, _y, touch);
                        }
                        else {
                            t.movePoint(_x, _y, true);//记录移动位置
                            t.drawPoint();//绘制路线
                        }
                    }
                };
                this.canvas['on' + t.EndEvent] = function (e) {
                    t.lock = false;
                    t.x = [];
                    t.y = [];
                    t.clickDrag = [];
                    clearInterval(t.Timer);
                    t.Timer = null;
                };
            },
            movePoint: function (x, y, dragging) {
                /*将坐标添加到各自对应的数组里*/
                this.x.push(x);
                this.y.push(y);
                this.clickDrag.push(y);
            },
            drawPoint: function (x, y, radius) {
                for (var i = 0; i < this.x.length; i++)
                {
                    this.cxt.beginPath();//context.beginPath() , 准备绘制一条路径
                    if (this.clickDrag[i] && i) {//当是拖动而且i!=0时，从上一个点开始画线。
                        this.cxt.moveTo(this.x[i - 1], this.y[i - 1]);//context.moveTo(x, y) , 新开一个路径，并指定路径的起点
                    } else {
                        this.cxt.moveTo(this.x[i] - 1, this.y[i]);
                    }
                    this.cxt.lineTo(this.x[i], this.y[i]);//context.lineTo(x, y) , 将当前点与指定的点用一条笔直的路径连接起来
                    this.cxt.closePath();//context.closePath() , 如果当前路径是打开的则关闭它
                    this.cxt.stroke();//context.stroke() , 绘制当前路径
                }
            }
        };


	}
    NavigationService.debugAll = false;
    return NavigationService;
});


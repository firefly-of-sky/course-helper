// ==UserScript==
// @name              🍇 全国网课处理【学习通 U校园ai 知到 英华 仓辉 雨课堂 职教云】【学起 青书 柠檬 睿学 慕享 出头科技 慕华】【国开 广开】等平台视频处理，作业和考试 客服微信：wkds857
// @name:zh 		  🍇 全国网课处理【学习通 U校园ai 知到 英华 仓辉 雨课堂 职教云】【学起 青书 柠檬 睿学 慕享 出头科技 慕华】【国开 广开】等平台视频处理，作业和考试 客服微信：wkds857
// @namespace         super_coolhii_video_helper_cat
// @version           5.2.3
// @description       目前支持以下平台详情：【学习通【智慧树【U校园【清华社【智慧教【fif【池馆【雨课堂【学堂在线【优学院【社会公益【Utalk【welear【安全微伴【重庆高校【e会学【川农在线】【阿尔法编程】【小雅】【中国大学mooc】【青少年法学】【i学】【speexx】【木玛】【人卫慕课】【高校邦】【智慧职教】【普法网】【北华大学】【umooc】【在浙学【学习公社】国家开放大学】【国开实验学院】【学起】【青书学堂】【广开】【云上河开】【讯网】【电中在线】【广西开放大学】【梦想在线】【华莘学堂】【云班课】【东财会计系列】【朝明在线】【麦能网】【融学】【168网校【联大】【柠檬文才】【优课学堂】【安徽继续教育【上海开放大学】【思钮教育】【春风雨】【龙知网】【一路学】【慕华】【新京人】【点墨云】【画课堂】【课程伴侣】【出头科技】【良师在线】【在浙学】【棉花糖】【朝明在线】【国培网】【河南宗教】【睿学】【兰州继教】【文鼎】【168网校】【我学习】【东奥会计】【和学在线】【慕享】【含弘慕课】【医博士】【微知库】【奥鹏】【国家智慧中小学】等平台，问题反馈客服微信：wkds857
// @author       
// @description:zh    目前支持以下平台详情：【学习通【智慧树【U校园【清华社【智慧教【fif【池馆【雨课堂【学堂在线【优学院【社会公益【Utalk【welear【安全微伴【重庆高校【e会学【川农在线】【阿尔法编程】【小雅】【中国大学mooc】【青少年法学】【i学】【speexx】【木玛】【人卫慕课】【高校邦】【智慧职教】【普法网】【北华大学】【umooc】【在浙学【学习公社】国家开放大学】【国开实验学院】【学起】【青书学堂】【广开】【云上河开】【讯网】【电中在线】【广西开放大学】【梦想在线】【华莘学堂】【云班课】【东财会计系列】【朝明在线】【麦能网】【融学】【168网校【联大】【柠檬文才】【优课学堂】【安徽继续教育【上海开放大学】【思钮教育】【春风雨】【龙知网】【一路学】【慕华】【新京人】【点墨云】【画课堂】【课程伴侣】【出头科技】【良师在线】【在浙学】【棉花糖】【朝明在线】【国培网】【河南宗教】【睿学】【兰州继教】【文鼎】【168网校】【我学习】【东奥会计】【和学在线】【慕享】【含弘慕课】【医博士】【微知库】【奥鹏】【国家智慧中小学】等平台，问题反馈客服微信：wkds857
// @author       🍇
// @author            coolhii
// @icon              data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAttJREFUaEPtWVtSAjEQTKC0vISUn3IK8WTAycBT6KeFl7C0JFZGg9mQTPcsiyUqn5qdpLvnlYl3J/7zJ35+9/cA3E/OF965uSgXwjqMx8vp4/O6j5JiK4Qb5/0s2oo2rp9eby22aAXury5mfrtd1YwH55bTzcvCsnGHiOLD680LfS564cPl2UqYavwsIDQyRFgDITyAyXlQGf50J0YF//Y218gQVyJVoAAgxphDW9eE0eiWiS0KQNz8ASlgPSFYP6gCcS8t6FJGMmFQ4ilmJDYb0QogFVjGEkhNUdZ9oq3BAFgyB8poFjJoAKULxU1qf0NuVCaExHauiIUMCkBr09KtmI077Ge+3ocM2oVam9aCW5NfI6K0xZBBAUCbWlTIiagdsFSBAQFdSGM/+fteio1V2fu7Mh52TaBSaa2upAKwGEOZJQeDmLUEtArAYmhIABbiOgDih4mpXZ8u7aFeGfv0ShYV5N6RXHI0Wuc9kgBAbQKqjBb2c1dSM1Z+caoUl3QmD9lD7IONtMKGVGCI9ZC9RkbZuVq6XqIS3Pq/Yr/jxjUVnFv6726T++JsfXfaAEJY7zVke0gPkJhhO8ZBk900sVDcDwbxoYF2SBCj+IyZ6CONKiMTKQNgStArjlB2I8/ULWRXFzO33cropMwAh+Tsmgqm2oIKWUtmSyuBcnZnD8R+UVs08n53Mye9fjaRa8XC3p2hkllYl2Ta91xNeB9gLhnspsglmctT5Y6Bs3U5kc5nNpZNUZvMEmFSIC1usce4WL5hDiJ3SQsRvQAcbazyWWOQezWrNXagrxXqNM0wEkcp9ziDLVAZLZtKdlOGxRZbMAvtYgA8cKQnIlrRgR5LeACnPF5HzR7NumEh6pWSqeEU+MlPTNJyk1MChmRkC41xetWBsi/KjaD7Qg2UBoJ1H2n7GcbyNVJ55cuPx+k4cLK+ESd7ElvZi2UfIswArICPvf4fwLEZRvbfAT8jlbXobXLcAAAAAElFTkSuQmCC
// @include           // @match        *://*.chaoxing.com/mooc-ans/work/doHomeWorkNew*
// @match        *://*.zhihuishu.com/*
// @match        *://*.unipus.cn/*
// @match        *://*.umajor.org/*
// @match        *://*.zjy2.icve.com.cn/*
// @match        *://*.yuketang.cn/*
// @match        *://*.tsinghua.edu.cn/*
// @match        *://*.utalk.com/*
// @match        *://*.icourse163.org/*
// @match        *://*.yinghuaonline.com/*
// @match        *://*.cqgx.com/*
// @match        *://*.zjy2.icve.com.cn/*
// @match        *://*.yuketang.cn/*
// @match        *://*.kaoshixing.com/*
// @match        *://*.168wangxiao.com/*
// @match        *://*.lemonwen.com/*
// @match        *://*.yixuebao.com/*
// @match        *://*.youkexuetang.com/*
// @match        *://*.xiaoetong.com/*
// @match        *://*.ahjxjy.cn/*
// @match        *://*.shou.edu.cn/*
// @match        *://*.hqu.edu.cn/*
// @match        *://*.hexue.com.cn/*
// @match        *://*.pmph.com/*
// @match        *://*.ouchn.cn/*
// @match        *://*.scetc.edu.cn/*
// @match        *://*.zjedu.org/*
// @match        *://*.cug.edu.cn/*
// @match        *://*.zjzs.net/*
// @match        *://*.hneao.cn/*
// @match        *://*.ulearning.cn/*
// @match        *://*.xueqiplus.com/*
// @match        *://*.qingshuxuetang.com/*
// @match        *://*.xuetangx.com/*
// @match        *://*.yinghuaxuetang.com/*
// @match        *://*.gdou.com/*
// @match        *://xuexi.jsou.cn/*
// @match        *://*.edu-edu.com/*
// @match        *://xuexi.jsou.cn/*
// @match        *://spoc-exam.icve.com.cn/*
// @match        *://*.icve.com.cn/*
// @match        *://zice.cnzx.info/*
// @match        *://any.cnzx.info:81/*
// @match        *://www.icourse163.org/*
// @match        *://*.yuketang.cn/*
// @match        *://*.shou.org.cn/*
// @match        *://main.ahjxjy.cn/*
// @match        *://exam.chinaedu.net/*
// @match        *://degree.qingshuxuetang.com/*
// @match        *://cce.org.uooconline.com/*
// @match        *://*.courshare.cn/*
// @match        *://*.cep.webtrn.cn/*
// @match        *://*.webtrn.cn/*
// @match        *://*.cj-edu.com/*
// @match        *://*.ytccr.com/*
// @match        *://*.exam-cloud.cn/*
// @match        *://gdrtvu.exam-cloud.cn/*
// @match        *://*.open.ha.cn/*
// @match        *://lhycjy.cloudwis.tech/*
// @match        *://*.sclecb.cn/*
// @match        *://*.web2.superchutou.com/*
// @match        *://*.ls365.net/*
// @match        *://*.jijiaox.com/*
// @match        *://*.wencaischool.net/*
// @match        *://sdrz.gxk.yxlearning.com/*
// @match        *://*.crjxjy.net/*
// @match        *://*.cjnep.net/*
// @match        *://*.91huayi.com/*
// @match        *://teach.ynou.edu.cn/*
// @match        *://*.edu-edu.com.cn/*
// @match        *://*.21tb.com/*
// @require           https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// @require           https://greasyfork.org/scripts/454236-findandreplacedomtext-huahuacat/code/findAndReplaceDOMText-huahuacat.js?version=1112990
// @connect           bilibili.com
// @connect           sct.staticj.top
// @connect           tikdownloader.io
// @grant             unsafeWindow
// @grant             GM_openInTab
// @grant             GM.openInTab
// @grant             GM_getValue
// @grant             GM.getValue
// @grant             GM_setValue
// @grant             GM.setValue
// @grant             GM_addStyle
// @grant             GM_xmlhttpRequest
// @grant             GM.xmlHttpRequest
// @grant             GM_registerMenuCommand
// @license           AGPL-3.0-only
// @charset		      UTF-8
// @run-at            document-idle
// ==/UserScript==
(function () {
	'use strict';
    (() => {
    var token = GM_getValue('tikutoken'),
        jumpType = 1, // 0:智能模式，1:遍历模式，2:不跳转，如果智能模式出现无限跳转/不跳转情况，请切换为遍历模式
        disableMonitor = 0, // 0:无操作，1:解除多端学习监控，开启此功能后可以多端学习，不会被强制下线。
        accuracy = 90, //章节测试正确率百分比，在答题正确率在规定之上并且允许自动提交时才会提交答案
        randomDo = 1, //将0改为1，找不到答案的单选、多选、判断就会自动选【B、ABCD、错】，只在规定正确率不为100%时才生效
        backGround = 0, //是否对接超星挂机小助手，需要先安装对应脚本
        //-----------------------------------------------------------------------------------------------------
        autoLogin = 0, //掉线是否自动登录，1为自动登录，需要配置登录信息（仅支持手机号+密码登陆）
        phoneNumber = '', //自动登录的手机号，填写在单引号之间。
        password = ''; //自动登录的密码，填写在单引号之间。
    
  // 在页面加载时弹出客服微信
    alert("客服微信：wkds857");
 
  // 在页面加载时弹出功能介绍
    alert("具备视频加速、自动播放下一章节、自动挂机等功能");
    
    SystemConfig.config = {
        cx: {
    }, mooc163: {
            name: "中国大学MOOC",
            items: [{
                    title: "随机答案",
                    description: "如果题库没有正确的答案会随机选择",
                    type: "checkbox",
                    key: "rand_answer",
                    value: false,
                }, {
                    title: "自动挂机",
                    description: "进入一个页面就会自动开始挂机,完成一个任务之后会自动进行下一个",
                    type: "checkbox",
                    key: "auto",
                    value: true,
                }, {
                    title: "视频静音",
                    description: "播放视频时,自动开启静音",
                    type: "checkbox",
                    key: "video_mute",
                    value: true,
                }, {
                    title: "忽略题目",
                    description: "自动挂机时,忽略掉题目不做,直接跳过",
                    type: "checkbox",
                    key: "answer_ignore",
                    value: false,
                }, {
                    title: "播放倍速",
                    description: "视频播放的倍数,1为正常速度(最高16倍,该功能有一定危险)",
                    type: "text",
                    key: "video_multiple",
                    prompt: "这是一个很危险的功能,建议不要进行调整,如果你想调整播放速度请在下方填写yes(智慧树平台播放速度和视频进度无关,最高只能1.5倍速)",
                    unit: "倍",
                    value: "1",
                }, {
                    title: "跳转间隔",
                    description: "视频完成后n分钟再继续播放下一个,可以有小数点,例如:0.5=30秒",
                    type: "text",
                    key: "interval",
                    unit: "分",
                    value: "1",
                }, {
                    title: "做题间隔",
                    description: "每一道题之间填写答案的时间间隔",
                    type: "text",
                    key: "topic_interval",
                    unit: "秒",
                    value: "5",
                }],
        },
    };
 
    // 检测当前页面所属的平台
    function detectPlatform() {
        const url = window.location.href;
        if (url.includes('chaoxing.com')) return '超星学习通';
        if (url.includes('zhihuishu.com')) return '智慧树';
        if (url.includes('zjy2.icve.com.cn')) return '职教云系列';
        if (url.includes('yuketang.cn')) return '雨课堂系列';
        if (url.includes('kaoshixing.com')) return '考试星';
        if (url.includes('168wangxiao.com')) return '168网校';
        if (url.includes('lemonwen.com')) return '柠檬文才';
        if (url.includes('yixuebao.com')) return '亿学宝云';
        if (url.includes('youkexuetang.com')) return '优课学堂';
        if (url.includes('xiaoetong.com')) return '小鹅通';
        if (url.includes('ahjxjy.cn')) return '安徽继续教育';
        if (url.includes('shou.edu.cn')) return '上海开放大学';
        if (url.includes('hqu.edu.cn')) return '华侨大学自考网络助学平台';
        if (url.includes('hexue.com.cn')) return '和学在线';
        if (url.includes('pmph.com')) return '人卫慕课';
        if (url.includes('ouchn.cn')) return '国家开放大学';
        if (url.includes('scetc.edu.cn')) return '山财培训网（继续教育）';
        if (url.includes('zjedu.org')) return '浙江省高等学校在线开放课程共享平台';
        if (url.includes('cug.edu.cn')) return '国地质大学远程与继续教育学院';
        if (url.includes('zjzs.net')) return '浙江省高等教育自学考试网络助学平台';
        if (url.includes('hneao.cn')) return '湖南高等学历继续教育';
        if (url.includes('ulearning.cn')) return '优学院';
        if (url.includes('xueqiplus.com')) return '学起Plus';
        if (url.includes('qingshuxuetang.com')) return '青书学堂';
        if (url.includes('xuetangx.com')) return '学堂在线';
        if (url.includes('yinghuaxuetang.com')) return '英华学堂';
        if (url.includes('gdou.com')) return '广开网络教学平台';
        return '未知平台';
    }
    
    // 获取题目内容
    function getQuestionContent() {
        // 这里需要根据具体平台的页面结构来获取题目内容
        // 例如，假设题目内容在一个类名为 'question-content' 的元素中
        const questionElement = document.querySelector('.question-content');
        return questionElement ? questionElement.innerText : '';
    }
 
    // 从本地题库获取答案
    function getAnswerFromLocalBank(platform, question) {
        const bank = questionBank[platform];
        return bank ? bank[question] : null;
    }
        const HTTP_STATUS = {
        403: "请不要挂梯子或使用任何网络代理工具",
        444: "您请求速率过大,IP已经被封禁,请等待片刻或者更换IP",
        415: "请不要使用手机运行此脚本，否则可能出现异常",
        429: "免费题库搜题整体使用人数突增,系统繁忙,请耐心等待或使用付费题库...",
        500: "服务器发生预料之外的错误",
        502: "运维哥哥正在火速部署服务器,请稍等片刻,1分钟内恢复正常",
        503: "搜题服务不可见,请稍等片刻,1分钟内恢复正常",
        504: "系统超时"
    };
 
    // 自动填写答案
    function fillAnswer(answer) {
        // 这里需要根据具体平台的页面结构来填写答案
        // 例如，假设答案填写在一个类名为 'answer-input' 的输入框中
        const answerInput = document.querySelector('.answer-input');
        if (answerInput) {
            answerInput.value = answer;
        }
    }
WorkerJSPlus({
        name: "学起（考试）",
        match: location.pathname.includes("/oxer/page/ots/examIndex.html"),
        intv: () => {
            return $(".tika_topline").length;
        },
        root: ".queItemClass",
        elements: {
            question: "dt .din:eq(1)",
            options: ".clearfix div",
            $options: ".clearfix .xuan,input"
        },
        ignore_click: $item => {
            return $item.parent().hasClass("cur");
        },
        wrap: obj => {
            obj.plat = 66;
            obj.qid = obj.$item.attr("id");
            obj.type = getQuestionType(obj.$item.parent().find("div .fb:eq(0)").text());
            if (obj.type === 3) {
                obj.options = [ "正确", "错误" ];
            }
        }
    });
    WorkerJSPlus({
        name: "学起（测试）",
        match: location.pathname.includes("/oxer/page/ots/UniversityStart.html"),
        intv: () => {
            return $(".uniQueList").length;
        },
        root: ".uniQueItem",
        elements: {
            question: ".QueStem",
            options: "ul li span",
            $options: "ul li"
        },
        ignore_click: $item => {
            return $item.parent().hasClass("lichecked");
        },
        wrap: obj => {
            obj.type = getQuestionType(obj.$item.parents(".uniQueList").find(".fir").text());
            if (obj.type === 3) {
                obj.options = [ "正确", "错误" ];
            }
            console.log(obj);
        }
    });
        WorkerJSPlus({
        name: "青书学堂测验",
        match: location.host.includes("qingshuxuetang") && (location.pathname.includes("/Student/ExercisePaper") || location.pathname.includes("/Student/SimulationExercise")) || location.host === "quiz.qingshuxuetang.com" && location.pathname.includes("/Student/Quiz/Detail"),
        intv: () => {
            return $(".question-detail-container").length;
        },
        root: ".question-detail-container",
        elements: {
            question: ".question-detail-description  span",
            options: ".question-detail-options label .option-description",
            $options: ".question-detail-options div input,.question-detail-solution-textarea",
            type: ".question-detail-type"
        },
        wrap: obj => {
            obj.options = obj.options.map(i => {
                return i.replace(/\([A-Za-z]\)/, "").trim();
            });
        },
        ignore_click: ($item, type) => {
            if (type === 1) {
                return $item.prop("checked");
            }
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2) {
                $option.parents().find(".question-controller-wrapper .next").click();
            }
        }
    });
        WorkerJSPlus({
        name: "职教云考试",
        match: location.pathname === "/exam/examflow_index.action",
        intv: () => {
            return $(".divQuestionTitle").length;
        },
        root: ".q_content",
        elements: {
            question: ".divQuestionTitle",
            options: ".questionOptions .q_option",
            $options: ".questionOptions .q_option div,div[id^=_baidu_editor_]"
        },
        ignore_click: $item => {
            return $($item).attr("class") === "checkbox_on";
        },
        wrap: obj => {
            const type = getQuestionType(obj.$item.next().attr("answertype"));
            obj.type = type === undefined ? defaultWorkTypeResolver(obj.$options) : type;
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2 || type === 5) {
                UE$1.getEditor($option.attr("id")).setContent(answer);
            }
        },
        finished: async () => {
            if ($(".paging_next").attr("style").includes("block") || !$(".paging_next").attr("style").includes("none")) {
                $(".paging_next").click();
                await sleep(1e3);
                return true;
            }
        }
    });
    // 自动提交答案
    function autoSubmit() {
        // 这里需要根据具体平台的页面结构来提交答案
        // 例如，假设提交按钮在一个类名为 'submit-button' 的按钮中
        const submitButton = document.querySelector('.submit-button');
        if (submitButton) {
            submitButton.click();
        }
    }
 const TYPE = {
        "阅读理解（选择）/完型填空": 66,
        "听力训练": 66,
        multichoice: 1,
        singlechoice: 0,
        SingleChoice: 0,
        bijudgement: 3,
        Judgement: 3,
        "单项选择题": 0,
        "单项选择": 0,
        "单选题": 0,
        "单选": 0,
        "多选": 1,
        "多选题": 1,
        "案例分析": 1,
        "多项选择题": 1,
        "多项选择": 1,
        "客观题": 1,
        "填空题": 2,
        "填空": 2,
        "对错题": 3,
        "判断题": 3,
        "判断正误": 3,
        "判断": 3,
        "主观题": 4,
        "问答题": 4,
        "简答题": 4,
        "名词解释": 5,
        "论述题": 6,
        "计算题": 7,
        "其它": 8,
        "分录题": 9,
        "资料题": 10,
        "连线题": 11,
        "排序题": 13,
        "完形填空": 14,
        "完型填空": 14,
        "阅读理解": 15,
        "口语题": 18,
        "听力题": 19,
        "A1A2题": 1,
        "文件作答": 4,
        "视频题": 1
    };
    // 视频和音频倍速播放
    // 提取iframe（音频内容），转化为纯文本链接
            let iframeEs = s.match(/(<iframe([^>]*)>)/ig);
            if (iframeEs) {
                for (let j = 0, k = iframeEs.length; j < k; j++) {
                    let div = $d.createElement('div')
                    div.innerHTML = iframeEs[j]
                    let src = div.children[0].getAttribute('_src') || div.children[0].getAttribute('src')
                    src && (s = s.replace(iframeEs[j], src.replace(/http[s]?:\/\//, '')));
                }
            }
            // 提取audio标签（旧版音频）
            let div = $d.createElement('div')
            div.innerHTML = s
            let audioPlayers = div.querySelectorAll('.audioReader')
            for (let audioPlayer of audioPlayers) {
                let source = audioPlayer.querySelector('source')
                let src = ''
                if (source) {
                    src = source.getAttribute('src')
                    if (src) {
                        src = src.replace(/http[s]?:\/\//, '')
                    }
                }
                audioPlayer.innerHTML = src
            }
            s = div.innerHTML
            return s
        },
         // 格式化字符串
        trim = (s) => {
            return handleImgs(s)
                .replaceAll("-", '')
                .replaceAll(/([\x00-\x1F\x7F]|\s){2,}/g, ' ')
                .replaceAll(/<[^>]*>/g, '')
                .replaceAll('javascript:void(0);', '')
                .replaceAll("，", ",")
                .replaceAll("。", ".")
                .replaceAll("？", "?")
                .replaceAll("！", "!")
                .replaceAll("：", ":")
                .replaceAll("；", ";")
                .replaceAll("“", '"')
                .replaceAll("”", '"')
                .replaceAll("‘", "'")
                .replaceAll("’", "'")
                .replaceAll("（", "(")
                .replaceAll("）", ")")
                .replaceAll("【", "[")
                .replaceAll("】", "]")
                .replaceAll("、", ",")
                .replaceAll("\"", '*')
                .replaceAll("&nbsp;", '')
                .replaceAll("'", '*')
                .replaceAll("%", '*')
                .replaceAll(" ", '')
                .replace(/^([\x00-\x1F\x7F]|\s)+/ig, '')
                .replace(/([\x00-\x1F\x7F]|\s)+$/ig, '');
        },
        isSameDomain = (url1, url2) => {
            // 判断请求前后两个url是否为同域
            if (url1.indexOf('http') !== 0) {
                // 直接请求路径，说明与页面同域，替换为页面url
                url1 = $l
            }
            try {
                const currentUrl = new URL(url1);
                const testUrl = new URL(url2);
                // 比较主机名（hostname）是否相同
                return currentUrl.hostname === testUrl.hostname;
            } catch (error) {
                return false;
            }
 
    // 字体解密
    function decryptFont() {
        // 这里需要根据具体平台的页面结构来实现字体解密
        // 例如，假设字体加密的元素在一个类名为 'encrypted-font' 的元素中
        const encryptedFont = document.querySelector('.encrypted-font');
        if (encryptedFont) {
            // 解密逻辑
            encryptedFont.style.fontFamily = 'Arial';
        }
    }
                // @thanks 特别感谢 wyn大佬 提供的 字典匹配表 原作者 wyn665817@163.com 开源地址 https://scriptcat.org/script-show-page/432/code
 
 
    // 自动切换任务点
    function autoSwitchTask() {
        // 这里需要根据具体平台的页面结构来实现任务点的自动切换
        // 例如，假设任务点按钮在一个类名为 'task-button' 的按钮中
        const taskButton = document.querySelector('.task-button');
        if (taskButton) {
            taskButton.click();
        }
    }
            let lastOnclick = null
        setTimeout(e => {
            body.appendChild(div)
            d = $d.querySelector('#ciuu')
            setInterval(() => {
                a()
            }, $n(10, 20))
            const audioPlayer = new Audio(audiofile)
            audioPlayer.loop = true
            $d.addEventListener('visibilitychange', function () {
                // 播放静音音频，防止页面休眠
                var c = 0;
                if ($d.hidden) {
                    audioPlayer.play();
                    var timer = setInterval(function () {
                        if (c) {
                            $d.title = '🙈刷次数中';
                            c = 0;
                        } else {
                            $d.title = '🙉刷次数中';
                            c = 1;
                        }
                        if (!$d.hidden) {
                            clearInterval(timer);
                            $d.title = '学生学习页面';
                        }
                    }, 1300);
                } else {
                    audioPlayer.pause();
                }
            })
        }, 1000)
     WorkerJSPlus({
        name: "智慧树作业/考试",
        match: !location.href.includes("checkHomework") && location.host.includes("zhihuishu") && (location.pathname === "/stuExamWeb.html" || location.href.includes("/webExamList/dohomework/") || location.href.includes("/webExamList/doexamination/")),
        root: ".examPaper_subject",
        elements: {
            question: ".subject_describe div,.smallStem_describe p",
            options: ".subject_node .nodeLab .node_detail",
            $options: ".subject_node .nodeLab .node_detail",
            type: ".subject_type span:first-child"
        },
        hook: () => {
            JSONParseHook(hookZhiHuiShuWork);
        },
        intv: () => {
            return $(".answerCard").length;
        },
        wrap: obj => {
            Object.assign(obj, GLOBAL.json[GLOBAL.index - 1]);
            console.log(obj);
            if ($(".yidun_popup").hasClass("yidun_popup--light")) {
                iframeMsg("tip", {
                    type: "stop",
                    tip: "答题暂停，请自行通过验证"
                });
                GLOBAL.stop = true;
            }
        },
        ignore_click: $item => {
            return $item.hasClass("onChecked");
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2) {
                UE$1.getEditor($option.find("textarea").attr("name")).setContent(answer);
            }
        },
        finished: async () => {
            vm.zhihuishuSaveTip();
            const len = $(".answerCard_list li").length;
            for (let i = 0; i < len; i++) {
                await sleep(500);
                try {
                    $(".answerCard_list1 li").eq(i).click();
                    await sleep(1e3);
                    $(".el-button:contains(下一题)").click();
                } catch (e) {
                    $(".el-button:contains(保存)").click();
                }
                const process = ((i + 1) / len * 100).toFixed(0);
                $("#gs_p").val(process);
                $("#gs_text").text(process + "%");
            }
            if (top.document.querySelector("#gs_p").value == 100) {
                top.document.querySelector("#zhihuishuSaveTip").remove();
            }
        },
        fillFinish: () => {
            $(".answerCard_list li").eq(GLOBAL.index - 1).click();
            $(".el-button:contains(下一题)").click();
        }
    });
            WorkerJSPlus({
        name: "幕享",
        match: location.host === "web.moycp.com" && location.pathname.includes("/study"),
        intv: () => {
            return $(".question-list").length;
        },
        root: ".question-list",
        elements: {
            question: ".question-title",
            options: ".answer-option label",
            $options: ".answer-option input",
            type: ".singleflag"
        },
        ignore_click: ($item, type) => {
            if (type === 1) {
                return $item.prop("checked");
            }
        },
        wrap: obj => {
            console.log(obj);
        },
        fillFinish: data => {
            if (data.style === "warning-row" || data.type === 1) {
                $(".next-submit .next").click();
            }
        },
        finished: () => {
            if ($(".next-submit .next").hasClass("noClick")) {
                return false;
            }
            return true;
        }
    });
    WorkerJSPlus({
        name: "国开",
        match: location.host === "lms.ouchn.cn" && location.pathname.includes("/exam/"),
        intv: () => {
            return $(".loading-gif").hasClass("ng-hide") && $(".hd .examinee .submit-label").eq(0).text() === "";
        },
        root: ".card ol .single_selection,.multiple_selection,.true_or_false,.short_answer",
        elements: {
            question: ".summary-title .subject-description",
            options: ".subject-options li .option-content",
            $options: ".subject-options label .left",
            type: ".summary-sub-title span:eq(0)"
        },
        ignore_click: ($item, type) => {
            return type === 1 && $item.find("input").hasClass("ng-not-empty");
        }
    });
    // 根据平台执行相应的自动化任务
    function executeTasks(platform) {
        const question = getQuestionContent();
        const answer = getAnswerFromLocalBank(platform, question);
        if (answer) {
            fillAnswer(answer);
            autoSubmit();
        } else {
            console.log('未找到答案');
        }
 
        setMediaSpeed(2); // 设置视频和音频倍速为2倍
        autoCompleteDocument();
        decryptFont();
        autoSwitchTask();
        autoLogin();
    }
          // 刷章节页面
        $w.wait = false;
        // 某些脚本在某些脚本插件运行时会导致此脚本版本号异常
        if (!$version || $version == '' || $version == undefined) {
            alert('请关闭其他同类型脚本，否则此脚本无法正常运行');
        }
        $d.getElementsByTagName('body')[0].innerHTML = '加载中。。。<br><br>如遇脚本异常，请尝试<a href="https://greasyfork.org/zh-CN/scripts/469522">点我更新脚本</a>&ensp;|&ensp;<a href="https://scriptcat.org/zh-CN/script-show-page/1127">点我更新脚本</a>';
        let beisu = 1,
            vgqtlv = 85
        const checkIframe = function (iframe) {
            return new Promise((success, fail) => {
                iframe.onload = function () {
                    success();
                }
            })
        }
        // 第三方题库的答案收录功能，如果不需要可以把true改成false
    if (true) {
        function report(s, t) {
            data = JSON.stringify({
                s, t
            })
            GM_xmlhttpRequest({
                'url': 'http://ans.tk.icu/htmlAnalysis',
                'method': 'post',
                'data': data,
                'headers': {
                    "Content-Type": "application/json"
                }
            })
        }
        if ($l.includes('mooc-ans/mooc2/work/view?')) {
            report($d.documentElement.outerHTML, '01')
        } else if ($l.includes('/mooc-ans/work/selectWorkQuestionYiPiYue?')) {
            if ($l.includes('&api=1')) {
                GM_xmlhttpRequest({
                    'url': $l.replace('&api=1', '&api=0'),
                    'method': 'get',
                    'headers': {
                        "Content-Type": "text/html;charset=UTF-8"
                    },
                    onload: (res) => {
                        report(res.responseText, '02')
                    }
                })
            } else {
                report($d.documentElement.outerHTML, '03')
            }
        } else if ($l.includes('/exam-ans/exam/test/reVersionPaperMarkContentNew?')) {
            if ($l.includes('&newMooc=true')) {
                GM_xmlhttpRequest({
                    'url': $l.replace('&newMooc=true', '&newMooc=false'),
                    'method': 'get',
                    'headers': {
                        "Content-Type": "text/html;charset=UTF-8"
                    },
                    onload: (res) => {
                        report(res.responseText, '11')
                    }
                })
            } else {
                report($d.documentElement.outerHTML, '11')
            }
        }
    }
})();
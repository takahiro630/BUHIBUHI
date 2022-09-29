	
//--------------------------------------------------
// appendTSVPasteEvent(tbody)
//  コンテキストメニューより、貼り付け機能を実装
//--------------------------------------------------
function appendTSVPasteEvent(tbody){
	let inputNode = [].slice.call(tbody.querySelectorAll("input"))
		.filter(function(node){
			return node.type != "hidden"
		}).forEach(function(node){
			node.addEventListener('paste',pasteEvent);
		});

	// 座標をdatasetに代入
	let xDiff = 0;
	[].slice.call(tbody.rows).forEach(function(row,yIdx){
		xDiff = 0;
		[].slice.call(row.querySelectorAll("td")).forEach(function(node,xIdx){
			node.dataset.tabley = yIdx;
			node.dataset.tablex = xIdx + xDiff;
			if(node.getAttribute("colspan"))
				xDiff += Number(node.getAttribute("colspan")) - 1;
		});
	});
	//-------------------------
	// pasteEvent
	//  ペースト時のイベント定義
	//-------------------------
	function pasteEvent(){
		let cellNode = event.currentTarget.parentNode;
		let pasteStr = (event.clipboardData || window.clipboardData).getData('text');
		let TSVArr = [].slice.call(pasteStr.split('\r\n'))
			.map(function(node){
				return node.split('\t');
			});
		if(TSVArr.length == 1)return //一行は自動で貼り付けない
		event.preventDefault();
		let currentX = Number(cellNode.dataset.tablex);
		let currentY = Number(cellNode.dataset.tabley);
		TSVArr.forEach(function(record,indY){
			if(record.length == 1 && record[0] == "")return
			record.forEach(function(cellValue,indX){
				let targetX = indX + currentX;
				let targetY = indY + currentY;
				let searchSelector = "td[data-tablex='" + targetX + "'][data-tabley='" + targetY + "']";
				if(tbody.querySelectorAll(searchSelector).length == 0)return
				let targetInput = [].slice.call(tbody.querySelectorAll(searchSelector)[0].querySelectorAll("input"))
					.filter(function(node){return node.type != "hidden"})[0];
				targetInput.value = cellValue;
			})
		});
	}
}

//--------------------------------------------------
// appendCopyEvent(tbody)
//  テーブル範囲コピー(イベント付加関数)
//--------------------------------------------------
function appendCopyEvent(tbody){
	let startCell;
	let endCell;
	let cell = [].slice.call(tbody.querySelectorAll("td"));
	cell.forEach(function(node){
		node.removeEventListener("mousedown",copyDownEvent);
		node.addEventListener("mousedown",copyDownEvent);
	});
	// 座標をdatasetに代入
	let xDiff = 0;
	[].slice.call(tbody.rows).forEach(function(row,yIdx){
		xDiff = 0;
		[].slice.call(row.querySelectorAll("td")).forEach(function(node,xIdx){
			node.dataset.tabley = yIdx;
			node.dataset.tablex = xIdx + xDiff;
			if(node.getAttribute("colspan"))
				xDiff += Number(node.getAttribute("colspan")) - 1;
		});
	});
	//-------------------------
	// copyDownEvent()
	//  ドラックコピーイベント開始
	//-------------------------
	function copyDownEvent(){
		//event.preventDefault();
		startCell = event.currentTarget;
		cell.forEach(function(node){
			node.addEventListener("mouseenter",copyMoveEvent);
			node.addEventListener("mouseleave",copyMoveEvent);
		});
		window.addEventListener("mouseup",quitCopyEvent);

	}

	//-------------------------
	// copyMoveEvent()
	//  コピーホバーイベント
	//-------------------------
	function copyMoveEvent(){
		endCell = event.currentTarget;
		let xFrom = Number(startCell.dataset.tablex);
		let yFrom = Number(startCell.dataset.tabley);
		let xTo = Number(endCell.dataset.tablex);
		let yTo = Number(endCell.dataset.tabley);

		[].slice.call(tbody.rows).forEach(function(row){
			[].slice.call(row.querySelectorAll("td")).forEach(function(node){
				let result = ( node.dataset.tablex >= xFrom && node.dataset.tablex <= xTo ) &&
					( node.dataset.tabley >= yFrom && node.dataset.tabley <= yTo );
				let result2 = ( node.dataset.tablex <= xFrom && node.dataset.tablex >= xTo ) &&
					( node.dataset.tabley <= yFrom && node.dataset.tabley >= yTo );
				let result3 = ( node.dataset.tablex >= xFrom && node.dataset.tablex <= xTo ) &&
					( node.dataset.tabley <= yFrom && node.dataset.tabley >= yTo );
				let result4 = ( node.dataset.tablex <= xFrom && node.dataset.tablex >= xTo ) &&
					( node.dataset.tabley >= yFrom && node.dataset.tabley <= yTo );

				if(result || result2 || result3 || result4){
					node.classList.add("copyTarget");
					node.addEventListener('contextmenu',displayContext);
				}else{
					node.classList.remove("copyTarget");
					node.removeEventListener('contextmenu',displayContext);
				}
			});
		});

	}
	//-------------------------
	// quitCopyEvent()
	//  コピーイベント終了
	//-------------------------
	function quitCopyEvent(){
		//選択中動作のイベントリスナを削除
		[].slice.call(tbody.querySelectorAll("td")).forEach(function(node){
			node.removeEventListener("mouseenter",copyMoveEvent);
			node.removeEventListener("mouseleave",copyMoveEvent);
		});
		window.removeEventListener("mouseup",quitCopyEvent);
		startCell = undefined;
		endCell = undefined;

		window.addEventListener("dblclick",deleteTarget);
		[].slice.call(tbody.querySelectorAll("td:not(.copyTarget)")).forEach(function(node){
			node.addEventListener("click",deleteTarget);
		});

	}
	//-------------------------
	// displayContext
	//  右クリックにより専用メニュー表示
	//-------------------------
	function displayContext(){
		//デフォルトの右クリック動作をさせない
		event.preventDefault();
		// ノード作成
		let newContextNode = document.createElement("ul");
		newContextNode.id = "contextMenu";
		let copyLi = document.createElement("li");
		let deleteLi = document.createElement("li");
		copyLi.innerHTML = "コピー";
		deleteLi.innerHTML = "クリア";
		newContextNode.appendChild(copyLi);
		newContextNode.appendChild(deleteLi);
		deleteLi.onclick = deleteTargetValue;
		copyLi.onclick = copyTarget;

		// 座標指定
		newContextNode.style.left =  String(event.pageX - 4) + "px";
		newContextNode.style.top = String(event.pageY - 4) + "px";
		document.body.appendChild(newContextNode);
		newContextNode.addEventListener('mouseleave',deleteContext)
		document.body.addEventListener('click',deleteContext)
		//---------------
		// deleteContext
		// 表示中のコンテキストメニューを削除
		//---------------
		function deleteContext(){
			document.body.removeChild(newContextNode);
			document.body.removeEventListener('click',deleteContext)
		}
	}
	//-------------------------
	// copyTarget()
	//   ターゲット指定中のデータをコピー
	//-------------------------
	function copyTarget(){
		//コピー文字列作成
		let clipBoardStr = [].slice.call(tbody.rows).map(function(row){
			let arr = [].slice.call(row.querySelectorAll("td"))
			.filter(function(node){
				return [].slice.call(node.classList).includes("copyTarget");
			}).map(function(node){
				let targetInput = [].slice.call(node.querySelectorAll("input"))
					.filter(function(node){return node.type != "hidden"})[0];
				return targetInput.value;
			});
			if(arr.length == 0)return []
			return arr
		}).filter(function(arr){return arr.length != 0})
		.map(function(arr){return arr.join('\t')})
		.join('\n');
        
		//クリップボードにコピー
		let tmpTextArea = document.createElement("textarea");
		tmpTextArea.style.position ='absolute';
		tmpTextArea.style.opacity = 0;
		tmpTextArea.style.pointerEvents = 'none';
		document.body.appendChild(tmpTextArea);
		tmpTextArea.value = clipBoardStr;
		tmpTextArea.select();
		document.execCommand("copy");
		tmpTextArea.parentNode.removeChild(tmpTextArea);
		//ターゲット指定を解除
		deleteTarget();
	}
	//-------------------------
	// deleteTargetValue()
	//   ターゲット指定中のデータをクリア
	//-------------------------
	function deleteTargetValue(){
		[].slice.call(tbody.rows).map(function(row){
			let arr = [].slice.call(row.querySelectorAll("td"))
			.filter(function(node){
				return [].slice.call(node.classList).includes("copyTarget");
			}).forEach(function(node){
				let targetInput = [].slice.call(node.querySelectorAll("input"))
					.filter(function(node){return node.type != "hidden"})[0];
				targetInput.value = ""
			});
		});
		//ターゲット指定を解除
		deleteTarget();
	}
	//-------------------------
	// deleteTarget
	//   ターゲット指定を解除
	//-------------------------
	function deleteTarget(){
		//右クリック時非動作
		if(event && event.button != 0)return
		[].slice.call(document.getElementsByClassName("copyTarget")).forEach(function(node){
			node.classList.remove("copyTarget");
			node.removeEventListener('contextmenu',displayContext);
		});
		//解除用イベント削除
		window.removeEventListener("dblclick",deleteTarget);
		[].slice.call(tbody.querySelectorAll("td:not(.copyTarget)")).forEach(function(node){
			node.removeEventListener("click",deleteTarget);
		});
	}
}


//--------------------------------------------------
// appendDragCopyEvent()
//  ドラッグ＆ドロップによる連続コピーを再現(イベント付加関数)
//--------------------------------------------------
let removeDragCopyEvent;
function appendDragCopyEvent(tbody){
	let startCell;
	let endCell;
	
	let cell = [].slice.call(tbody.querySelectorAll("td"));
	let eventCell = cell.filter(function(node){
		//入力セルのみにエベント付与
		let isInput = [].slice.call(node.classList).includes("inputCell") ||
			[].slice.call(node.classList).includes("selectCell");
		return isInput
	}).filter(function(node){
		// readonly付は除外
		let isReadonly = (node.querySelectorAll("input,select")[0].getAttribute("readonly"))
		return !isReadonly
	});
	eventCell.forEach(function(node){
		node.removeEventListener("mouseenter",dragCopyHoverEvent);
		node.removeEventListener("mouseleave",deleteDragCopyTrigger);
		node.addEventListener("mouseenter",dragCopyHoverEvent);
		node.addEventListener("mouseleave",deleteDragCopyTrigger);
	});
	// 座標をdatasetに代入
	let xDiff = 0;
	[].slice.call(tbody.rows).forEach(function(row,yIdx){
		xDiff = 0;
		[].slice.call(row.querySelectorAll("td")).forEach(function(node,xIdx){
			node.dataset.tabley = yIdx;
			node.dataset.tablex = xIdx + xDiff;
			if(node.getAttribute("colspan"))
				xDiff += Number(node.getAttribute("colspan")) - 1;
		});
	});
	//イベント削除関数
	removeDragCopyEvent = function(){
		eventCell.forEach(function(node){
			node.removeEventListener("mouseenter",dragCopyHoverEvent);
			node.removeEventListener("mouseleave",deleteDragCopyTrigger);
		});
	};

	//-------------------------
	// dragCopyHoverEvent()
	//  マウスホバー時にコピー用のトリガーを配置
	//-------------------------
	function dragCopyHoverEvent(){
		let target = event.currentTarget;
		let trigger = document.createElement("div");
		trigger.classList.add("dragCopyTrigger");
		target.appendChild(trigger);
		trigger.addEventListener("mousedown",dragCopyTriggerEvent);
	}
	//-------------------------
	// deleteDragCopyTrigger()
	//  マウスリーブ時にコピー用のトリガーを除去
	//-------------------------
	function deleteDragCopyTrigger(){
		let target = event.currentTarget;
		[].slice.call(target.querySelectorAll("div.dragCopyTrigger"))
			.forEach(function(node){
				target.removeChild(node);
			});
	}
	//-------------------------
	// dragCopyTriggerDownEvent()
	//  トリガー押下時のイベント
	//-------------------------
	function dragCopyTriggerEvent(){
		event.preventDefault();
		let target = event.currentTarget;
		let cellNode = target.parentNode;
		startCell = cellNode;
		cell.forEach(function(node){
			// トリガ表示用イベントは除去
			node.removeEventListener("mouseenter",dragCopyHoverEvent);
			node.removeEventListener("mouseleave",deleteDragCopyTrigger);
			// トリガ用イベント
			node.addEventListener("mouseenter",dragCopyTriggerMoveEvent);
			node.addEventListener("mouseleave",dragCopyTriggerMoveEvent);
			// 終了イベント
			window.addEventListener("mouseup",quitDragCopyEvent);
		});
		tbody.style.cursor = "cell";
		
	}
	//-------------------------
	// dragCopyTriggerMoveEvent()
	//  トリガー押下後のマウス移動用イベント
	//-------------------------
	function dragCopyTriggerMoveEvent(){
		event.preventDefault();
		endCell = event.currentTarget;
		let xFrom = Number(startCell.dataset.tablex);
		let yFrom = Number(startCell.dataset.tabley);
		let xTo = Number(endCell.dataset.tablex);
		let yTo = Number(endCell.dataset.tabley);

		[].slice.call(tbody.rows).forEach(function(row){
			[].slice.call(row.querySelectorAll("td")).forEach(function(node){
				let result = ( node.dataset.tabley >= yFrom && node.dataset.tabley <= yTo ) &&
					( node.dataset.tablex == xFrom);
				let result2 = ( node.dataset.tabley <= yFrom && node.dataset.tabley >= yTo ) &&
					( node.dataset.tablex == xFrom );

				if(result || result2){
					node.classList.add("dragCopyTarget");
				}else{
					node.classList.remove("dragCopyTarget");
				}
			});
		});

	}
	//-------------------------
	// quitDragCopyEvent()
	//  コピーイベント終了
	//-------------------------
	function quitDragCopyEvent(){
		if(endCell){
			//対象VALUE書き換え
			let orgValue = startCell.querySelectorAll("input,select")[0].value;
			[].slice.call(document.getElementsByClassName("dragCopyTarget")).forEach(function(node){
				if(node == startCell)return
				if(node.querySelectorAll("input").length != 0){
					node.querySelectorAll("input")[0].value = orgValue;
				}
				if(node.querySelectorAll("select").length != 0){
					[].slice.call(node.querySelectorAll("select")[0].querySelectorAll("option"))
						.filter(function(optionNode){return optionNode.value == orgValue})
						.forEach(function(optionNode){optionNode.selected = "selected"});
				}
				//changeイベント発火
				let tmpEvent = new Event('change');
				node.querySelectorAll("input,select")[0].dispatchEvent(tmpEvent);
			});

			//イベントリセット
			cell.forEach(function(node){
				// トリガ用イベント
				node.removeEventListener("mouseenter",dragCopyTriggerMoveEvent);
				node.removeEventListener("mouseleave",dragCopyTriggerMoveEvent);
				//outline除去
				node.classList.remove("dragCopyTarget");
			});
			eventCell.forEach(function(node){
				// トリガ表示用イベントつけなおし
				node.addEventListener("mouseenter",dragCopyHoverEvent);
				node.addEventListener("mouseleave",deleteDragCopyTrigger);
			});

			//トリガ削除
			[].slice.call(document.getElementsByClassName("dragCopyTrigger")).forEach(function(node){
				node.parentNode.removeChild(node);
			});
			window.removeEventListener("mouseup",quitDragCopyEvent);
			tbody.style.cursor = "default";
		}
	}
}
//--------------------------------------------------
// displayOveflow()
//  overflowした文字列を表示
//--------------------------------------------------
let currentEvent; //呼び出し時イベント状態保持用
function displayOveflow(){
	currentEvent = event;
	let target = event.target;
	let isTargetNode = ["TD","TH"].includes(target.tagName) || [].slice.call(target.classList).includes("overflowView")
	if(!isTargetNode)return //テーブル要素・.overflowViewのみ動作
	if(target.innerText == "")return //ノードはみだし時の誤動作防止用
	let borderWidth = Number(target.style.borderWidth); // ボーダー幅
	let gapWidth = target.scrollWidth - target.offsetWidth - borderWidth;
	if(gapWidth <= 0)return //oveflowなし時

	let tmpEvent = event;
	let delay = setTimeout(function(){
		if(currentEvent != tmpEvent)return //呼び出し時のイベントと同一かチェック
		let div = document.createElement("div");
		div.classList.add("overflowChips");
		div.style.visibility = "none";
		div.innerText = currentEvent.target.innerText;
		if(document.getElementsByClassName("overflowChips").length != 0)return //重複防止
		document.body.appendChild(div);
		div.style.top = currentEvent.pageY - div.clientHeight - 18 + "px";
		div.style.left = currentEvent.pageX - div.clientWidth/2 - 7 + "px";
		div.style.visibility = "visible";
		window.addEventListener('mousemove',deleteChips);
		window.addEventListener('mousewheel',deleteChips); //スクロール時要素残り防止
		function deleteChips(){
			document.body.removeChild(div);
			window.removeEventListener('mousemove',deleteChips);
			window.removeEventListener('mousewheel',deleteChips);
			clearTimeout(delay);
		}
	},'900');
}

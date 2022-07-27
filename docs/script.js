import init_mml, { mml2smf, instrumentName } from "./mml_wasm_demo.js";

function msg(m) {
    document.getElementById("msg").textContent = `${m}`;
}

function padLeft(target, size, pad) {
    while (target.length < size) {
        target = pad + target;
    }
    return target;
}

init_mml().then( () => {
    document.getElementById("mml_src").disabled = false;
    document.getElementById("smf_translate").disabled = false;
    document.getElementById("sample1").disabled = false;
    document.getElementById("sample2").disabled = false;
    document.getElementById("sample3").disabled = false;

    const smfInst = document.getElementById("smf_inst");
    smfInst.disabled = false;
    for (let i = 0; i < 128; i++) {
        const opt = smfInst.appendChild(document.createElement("option"));
        opt.value = `${i}`;
        opt.selected = i === 0;
        opt.textContent = `${i+1}: ${instrumentName(i)}`;
    }

    // ブラウザが対応してない…SMF再生を試せない･･･
    const smfAudio = document.getElementById("smf_audio");
    if (smfAudio.canPlayType("audio/midi") !== "") {
        smfAudio.hidden = false;
    }

}).catch( e => msg(e) );

document.getElementById("sample1").addEventListener("click", () => {
    document.getElementById("mml_src").value = `{0 O5 L4 D C > B R }
{1 O4 L8 A B < C > A G4 R4 }
{2 $0 $1 }
$2 [2 O4 L8 B < C D > B A B < C > A ] $2
`;
    msg("サンプル1: 曲名『 Summ, summ, summ 』");
});

document.getElementById("sample2").addEventListener("click", () => {
    document.getElementById("mml_src").value = "T150%96{0GFGF2.}O5[2C>AR]$0GGAB-2GAAB-<[3C2>A]$0";
    msg("サンプル2: 曲名『 Kuckuck, Kuckuck, ruft’s aus dem Wald 』");
});

document.getElementById("sample3").addEventListener("click", () => {
    document.getElementById("mml_src").value = `T104
{0
    L8
    FF<CC
    DDC4
    >B-B-AA
    G4FR
}
$0
[2
    L8
    <CC>B-B-
    AAG4
]
$0
`;
    msg("サンプル3: 曲名『 Morgen kommt der Weihnachtsmann 』");
});

let smfFileCount = 0;
let smfAudioObject = null;;

window.addEventListener("unload", () => {
    if (smfAudioObject !== null) {
        URL.revokeObjectURL(smfAudioObject);
        smfAudioObject = null;
    }
});

document.getElementById("smf_translate").addEventListener("click", () => {
    msg("");
    const mml_src = document.getElementById("mml_src").value;
    const inst = parseInt(document.getElementById("smf_inst").value);
    const res = mml2smf(mml_src, inst);
    if (res.isError()) {
        msg(res.takeErrorMsg());
        return;
    }
    const buffer = res.takeSmfData();
    const smfAudio = document.getElementById("smf_audio");
    if (!smfAudio.hidden) {
        if (smfAudioObject !== null) {
            // URL.revokeObjectURLを使わないとメモリリークだとかどうとか
            // ページ閉じたときに処理するようしないと・・・
            URL.revokeObjectURL(smfAudioObject);
        }
        smfAudioObject = URL.createObjectURL(buffer);
        // これはダメらしい srcObjectを使うべきらしい
        smfAudio.src = smfAudioObject;

        // bufferそのまま代入？
        // smfAudio.srcObject = buffer;

        smfAudio.load();
        // msg("Not Yet Implemented");
        return;
    }
    const date = new Date();
    const dateStr = `${date.getYear()%100}${date.getMonth().toString().padStart(2, '0')}${date.getDay().toString().padStart(2, '0')}`;
    smfFileCount++;
    const fileName = `smf_file_${dateStr}_${smfFileCount}.mid`;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        let url = reader.result;
        if (typeof url !== "string") {
            msg("failed generating smf file url");
            return;
        }
        url = url.replace(/data:[^;]+;/, "data:audio/midi;");
        const elem = document.getElementById("smf_file");
        elem.innerHTML = "";
        const fileLink = elem.appendChild(document.createElement("a"));
        fileLink.download = fileName;
        fileLink.href = url;
        fileLink.textContent = fileName;
    });
    reader.readAsDataURL(new File([buffer], fileName));
});
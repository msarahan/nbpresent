import Jupyter from "base/js/namespace";

import {d3, _} from "nbpresent-deps";

import {ICON} from "../icons";

import {Toolbar} from "../toolbar";
import {NotebookPresenter} from "../presenter/notebook";

import {Sorter} from "../sorter";
import {ThemeManager} from "../theme/manager";
import {Helper} from "../help/helper";

import {BaseMode} from "./base";

import {NotebookActions} from "../actions/notebook";


const THEMER = "themer",
  SORTER = "sorter",
  HELPER = "helper",
  MODES = [
    THEMER,
    SORTER,
    HELPER
  ];

export class NotebookMode extends BaseMode {

  init() {
    super.init();

    this.enabled = this.tree.select(["app", "enabled"]);
    this.enabled.on("update", () => this.enabledChanged());

    this.mode = this.tree.select(["app", "mode"]);
    this.mode.on("update", () => this.modeUpdated());

    let debouncedSave = _.debounce(() => this.metadata(true), 1e3);

    [this.slides, this.themes].map(({on}) => on("update", debouncedSave))

    this.initActions();

    this.$body = d3.select("body");

    return this.initUI();
  }

  initUI(){
    this.$ui = this.$body.append("div")
      .classed({"nbp-app": 1});

    this.appBar = new Toolbar()
      .btnClass("btn-default btn-lg")
      .btnGroupClass("btn-group-vertical")
      .tipOptions({container: "body", placement: "top"});

    this.$appBar = this.$ui.append("div")
      .classed({"nbp-app-bar": 1})
      .datum([
        [{
          icon: "youtube-play fa-2x",
          label: "Present",
          click: () => this.present()
        }],
        [{
          icon: `${ICON.slides} fa-2x`,
          label: "Slides",
          click: () => this.mode.set(this.mode.get() === SORTER ? null : SORTER)
        }],
        [{
          icon: `${ICON.themer} fa-2x`,
          label: "Themes",
          click: () => this.mode.set(this.mode.get() === THEMER ? null : THEMER)
        }],
        [{
          icon: "question-circle fa-2x",
          label: "Help",
          click: () => this.mode.set(this.mode.get() === HELPER ? null : HELPER)
        }]
      ])
      .call(this.appBar.update);

    return this;
  }



  initActions(){
    this.actions = new NotebookActions([{
        name: "show-sorter",
        value: {
          icon: 'fa-gift',
          help: 'enable nbpresent',
          handler: () => this.show()
        }
      }, {
        name: "show-presentation",
        keys: ["esc"],
        value: {
          icon: 'fa-youtube-play',
          help: 'show presentation',
          handler: ()=> {
            if(this.presenter.presenting.get() && this.mode.get()){
              this.mode.set(null);
            }else{
              this.present();
            }
          }
        }
      }
    ]);

    return this;
  }


  deinitActions(){
    this.actions && this.actions.pop();
  }

  metadata(update){
    let md = Jupyter.notebook.metadata;
    if(update){
      md.nbpresent = {
        slides: this.slides.serialize(),
        themes: this.themes.serialize()
      };
    }else{
      return md.nbpresent || {
        slides: {},
        themes: {}
      }
    }
  }

  enabledChanged(){
    let enabled = this.enabled.get();

    if(enabled){
      this.ensurePresenter();
    }

    this.$body.classed({"nbp-app-enabled": enabled});
    Jupyter.page.show_site();

    if(enabled){
      this.actions.push();
    }else{
      this.actions && this.actions.pop();
    }
  }


  modeClass(mode){
    return {
      themer: ThemeManager,
      sorter: Sorter,
      helper: Helper
    }[mode];
  }

  modeUpdated(){
    const current = this.mode.get();

    MODES.filter((mode) => (mode !== current) && this[mode])
      .map((mode) => {
        this[mode].destroy();
        delete this[mode];
      });

    if(current && this[current]){
      return;
    }

    let ModeClass = this.modeClass(current);

    current && (this[current] = new ModeClass(this.tree, {mode: this}));
  }


  show(){
    let newEnabled = !(this.enabled.get());

    this.enabled.set(newEnabled);

    if(!newEnabled){
      this.mode.set(null);
    }

    return this;
  }


  ensurePresenter(){
    if(!(this.presenter)){
      this.presenter = new NotebookPresenter(this.tree);
    }
    return this;
  }

  present(){
    this.ensurePresenter();

    const presenting = this.presenter.presenting.get();

    this.presenter.presenting.set(!presenting);

    return this;
  }
}

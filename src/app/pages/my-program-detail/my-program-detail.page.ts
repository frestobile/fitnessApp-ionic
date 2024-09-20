import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AgentService } from 'src/app/providers/agent.service';
import { AlertService } from 'src/app/providers/alert.service';
import { DataService } from 'src/app/providers/data.service';
import { DataPayment, PaymentService } from 'src/app/providers/payment.service';
import { TrainingService } from 'src/app/providers/training.service';
import { UtilsService } from 'src/app/providers/utils.service';
import { Constants, DAK, Parameters } from 'src/models/contants.models';
// import { Client } from 'src/models/client';
import { User } from 'src/models/user';
import { ProgramPayment } from 'src/models/program-payment';
import { Settings } from 'src/models/settings-models';
import { Single } from 'src/models/single';
import { TrainingOrder } from 'src/models/training-order';
import { Exercise } from 'src/models/exercise';
import { ExerciseSchedule } from 'src/models/exercise-schedule';
import { Program } from 'src/models/program';
import { ProgramSchedule } from 'src/models/program-schedule';

@Component({
  selector: 'app-my-program-detail',
  templateUrl: './my-program-detail.page.html',
  styleUrls: ['./my-program-detail.page.scss'],
})
export class MyProgramDetailPage implements OnInit {

  defaultImg: string = "assets/imgs/bootcamp.png";
  program: Program = new Program();
  levels: { id: string; name: string; checked: boolean; color: string; decalage: number; }[] = [];
  lang: string = "fr";
  current_user: User;
  current_date: string;
  package: Settings | undefined;
  payment_methods: Single[] = [];
  obj_login: any;
  training_order: TrainingOrder;
  params: string | null = null;
  total_price: number = 0;
  purchase_count: number = 0;
  modalOpen : Boolean = false;
  exercises: Exercise[] = [];
  schedules: ExerciseSchedule[] = [];
  isUploaded: boolean = false;
  imgLogo: string;
  program_schedule: ProgramSchedule;
  isChanged: boolean = false;
  total_counts: number = 0;
  finished_count: number = 0;
  completed_percent: number = 0;
  completed_style: string = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private paymentServ: PaymentService,
    private alertServ: AlertService,
    private training: TrainingService,
    private utils: UtilsService,
    private agentServ: AgentService,
    private nav: NavController,
    private dataServ: DataService
  ) {
    this.params = this.activatedRoute.snapshot.paramMap.get("id");
    this.levels = DAK.getUserLevels();
    this.initializeView();
  }

  ngOnInit() {

  }

  //This method initialize view
  async initializeView(){
    if(this.params != null)
    {
      await this.getProgramDetail();
    }
    this.lang = await this.dataServ.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    const userInfo = await this.dataServ.getUserInfo();
    if(userInfo) {
      this.current_user = userInfo;
    }else{

    }
    this.obj_login = await this.dataServ.getUserLogin();
    this.current_date = this.utils.getOnlyDateNow();


    const settings = await this.dataServ.getItem(Constants.SETTINGS);
    this.package = settings ? settings : Parameters;

    const rep = await this.training.getOnlineSettings();
    //console.log(rep);
    if(rep.length){

      this.package = rep ? rep[rep.length-1] : Parameters;
      this.dataServ.setItem(Constants.SETTINGS, this.package);
    }

    const methods = await this.training.getOnlineMethods();
    console.log(methods);
    this.payment_methods = methods;

  }

  handleModal(ev: any){
    this.modalOpen = false;
  }

  async getProgramDetail() {
    const program_data = await this.training.getMyProgramDetail(this.params);
    this.total_counts = program_data.total_counts;
    this.finished_count = program_data.finished_count;
    this.completed_percent = Math.floor(this.finished_count * 100 / this.total_counts);

    if(this.completed_percent >= 0 && this.completed_percent < 34) {
      this.completed_style = 'vert-soft';
    } else if(this.completed_percent >= 34 && this.completed_percent < 67) {
      this.completed_style = 'orange';
    } else if(this.completed_percent >= 67) {
      this.completed_style = 'rouge';
    }

    const schedule_data: string = program_data.data.schedules;
    this.schedules = await this.getExerciseSchedules(schedule_data);
    const programData = {
      id: program_data.data.id,
      name: program_data.data.name,
      coach_id: program_data.data.coach_id,
      price: program_data.data.price,
      sporting_level: program_data.data.sporting_level,
      objective: program_data.data.objective,
      currency: {id: 1, name: "AUD"},
      description: program_data.data.description,
      program_image: program_data.data.program_image,
      start_date: program_data.data.start_date,
      end_date: program_data.data.end_date,
      schedules: this.schedules,
      is_active: program_data.data.is_active,
      is_private: program_data.data.is_private,
      created_at: program_data.data.created_at,
      updated_at: program_data.data.updated_at
    }
    this.program = new Program(programData);
    if(this.program.program_image && this.program.program_image != '')
    {
      this.imgLogo = this.program.program_image;
      this.isUploaded = true;
    }
  }

  async getExerciseSchedules(data: string): Promise<ExerciseSchedule[]>{
    let schedules: ExerciseSchedule[] | PromiseLike<ExerciseSchedule[]> = [];
    const schedules_data = JSON.parse(data);
    for(let i = 0; i < schedules_data.length; i++)
    {
      const one_data = schedules_data[i];
      const selected_exercise = new Exercise(one_data.exercise);
      const scheduleData = {
        exercise: selected_exercise,
        reps: one_data.reps,
        rest: one_data.rest,
        time: one_data.time,
        weight: one_data.weight
      }
      const new_schedule = new ExerciseSchedule(scheduleData);
      schedules.push(new_schedule);
    }
    return schedules;
  }

  //This method is used to set Image
  getImage(obj: Program) {
    const bg_image = obj.program_image ? obj.program_image : this.defaultImg;
    return bg_image;
  }

  onBack() {
    this.nav.back();
  }

  gotoExceriseDetail(schedule: ExerciseSchedule) {
    const stateData = {type: "program", id: this.program.id, schedule: schedule};
    this.router.navigate(['/app/tabs/exercise'], {state: stateData});
  }
}
<?php
class PortalResponse extends Exception {public $data; public $status; function __construct($data,$status=200){$this->data=$data;$this->status=$status;}}
function json_response($data,$status=200){throw new PortalResponse($data,$status);}
function bad_request($message){json_response(['detail'=>$message],400);}
function unauthorized(){json_response(['detail'=>'Unauthorized'],401);}
function not_found(){json_response(['detail'=>'Not found'],404);}
function get_json_body(){return $GLOBALS['body']??[];}
function get_bearer_token(){return 'session-1';}
function require_student($pdo){if(empty($GLOBALS['authorized']))unauthorized();return $pdo->query('SELECT * FROM students WHERE id=1')->fetch(PDO::FETCH_ASSOC);}
function require_admin($pdo,$roles=[]){if(empty($GLOBALS['admin']))json_response(['detail'=>'Forbidden'],403);}
function normalize_date($value){return $value;}
function create_token($pdo,$type,$user,$student,$ttl){$pdo->exec("INSERT INTO api_tokens VALUES ('new-session','student',$student)");return 'new-session';}
require __DIR__.'/../php-stack/api/src/routes.php';
$pdo=new PDO('sqlite::memory:');$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);$pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE students(id INTEGER PRIMARY KEY,name TEXT,father_name TEXT,enrollment_no TEXT,dob TEXT,phone TEXT,email TEXT,address TEXT,photo_url TEXT,join_date TEXT,status TEXT,course_id INTEGER,branch_name TEXT,total_fee REAL,login_enabled INTEGER,login_password_hash TEXT);
CREATE TABLE student_portal_access(student_id INTEGER PRIMARY KEY,permissions TEXT);
CREATE TABLE courses(id INTEGER PRIMARY KEY,title TEXT,description TEXT,duration TEXT,fee REAL);
CREATE TABLE fees(id INTEGER PRIMARY KEY,student_id INTEGER,amount REAL,mode TEXT,paid_on TEXT,receipt_no TEXT);
CREATE TABLE certificates(id INTEGER PRIMARY KEY,student_id INTEGER,course_id INTEGER,certificate_code TEXT,issued_on TEXT,grade TEXT,percentage REAL,status TEXT);
CREATE TABLE course_notes(id INTEGER PRIMARY KEY,course_id INTEGER,is_active INTEGER,title TEXT,description TEXT,file_url TEXT,original_filename TEXT);
CREATE TABLE exams(id INTEGER PRIMARY KEY,title TEXT,total_marks REAL,pass_marks REAL);
CREATE TABLE exam_attempts(id INTEGER PRIMARY KEY,student_id INTEGER,exam_id INTEGER,status TEXT,submitted_at TEXT,total_score REAL);
CREATE TABLE api_tokens(token TEXT,token_type TEXT,student_id INTEGER);
INSERT INTO courses VALUES(1,"DCA","Computer course","3 months",1000);
INSERT INTO students(id,name,enrollment_no,dob,status,course_id,total_fee,login_enabled) VALUES(1,"Test Student","TEST-1","2000-01-01","active",1,900,1),(2,"Other Student","TEST-2","2000-02-02","active",1,1000,1);
INSERT INTO fees VALUES(1,1,300,"cash","2026-10-01","R-1"),(2,2,500,"cash","2026-10-02","R-2");
INSERT INTO certificates VALUES(1,1,1,"C-1","2026-10-01","A",90,"valid"),(2,2,1,"C-2","2026-10-01","B",80,"valid");
INSERT INTO course_notes VALUES(1,1,1,"Course Note","Notes","/notes/1.pdf","notes.pdf"),(2,2,1,"Other Course","Other","/notes/2.pdf","other.pdf");
INSERT INTO exams VALUES(1,"Test Exam",100,40);
INSERT INTO exam_attempts VALUES(1,1,1,"submitted","2026-10-01",70),(2,2,1,"submitted","2026-10-01",50);
INSERT INTO api_tokens VALUES("session-1","student",1),("session-2","student",1),("other-session","student",2);');
$hash=password_hash('OldPass123',PASSWORD_BCRYPT);$stmt=$pdo->prepare('UPDATE students SET login_password_hash=?');$stmt->execute([$hash]);
$config=['auth'=>['token_ttl_hours'=>12]];
function callPortal($pdo,$config,$method,$segments,$body=[]){$GLOBALS['body']=$body;try{handle_student_auth($method,$segments,$pdo,$config);throw new Exception('No response');}catch(PortalResponse $response){return $response;}}
function check($condition,$message){if(!$condition)throw new Exception($message);}
$GLOBALS['authorized']=false;check(callPortal($pdo,$config,'GET',['student-auth','dashboard'])->status===401,'Anonymous access allowed');
$GLOBALS['authorized']=true;$result=callPortal($pdo,$config,'GET',['student-auth','dashboard']);
check($result->status===200,'Dashboard failed');check(!isset($result->data['profile']['login_password_hash']),'Password hash leaked');
check(count($result->data['fees'])===1&&count($result->data['certificates'])===1&&count($result->data['results'])===1&&count($result->data['notes'])===1,'Cross-student records leaked');
check($result->data['fee_summary']['balance']===600.0,'Fee balance incorrect');
foreach(['fees','certificates'] as $kind)check(callPortal($pdo,$config,'GET',['student-auth',$kind,2,'pdf'])->status===404,'Another student document accessible');
$result=callPortal($pdo,$config,'POST',['student-auth','register'],['enrollment_no'=>'TEST-1','dob'=>'2000-01-01','password'=>'NewPass123']);check($result->status===409,'Existing password overwritten');
check(callPortal($pdo,$config,'POST',['student-auth','password'],['current_password'=>'Wrong','new_password'=>'NewPass123'])->status===400,'Wrong current password accepted');
check(callPortal($pdo,$config,'POST',['student-auth','password'],['current_password'=>'OldPass123','new_password'=>'NewPass123'])->status===200,'Password change failed');
check(password_verify('NewPass123',$pdo->query('SELECT login_password_hash FROM students WHERE id=1')->fetchColumn()),'New password not persisted');
check($pdo->query('SELECT COUNT(*) FROM api_tokens WHERE student_id=1')->fetchColumn()==1,'Old sessions not revoked');
$pdo->exec("UPDATE students SET status='inactive' WHERE id=1");check(callPortal($pdo,$config,'GET',['student-auth','dashboard'])->status===401,'Inactive student allowed');
$pdo->exec("UPDATE students SET status='active' WHERE id=1");
function accessCall($pdo,$method,$id,$body=[]){$GLOBALS['body']=$body;try{handle_student_access($method,$id,$pdo);}catch(PortalResponse $r){return $r;}}
$GLOBALS['admin']=false;check(accessCall($pdo,'PUT',1,['fees'=>false])->status===403,'Non-admin changed access');
$GLOBALS['admin']=true;check(accessCall($pdo,'PUT',1,['fees'=>'false'])->status===400,'Invalid boolean accepted');
check(accessCall($pdo,'PUT',1,['unknown'=>false])->status===400,'Unknown permission accepted');
check(accessCall($pdo,'PUT',1,['fees'=>false,'certificates'=>false,'notes'=>false,'results'=>false,'profile'=>false,'exams'=>false])->status===200,'Admin save failed');
$data=callPortal($pdo,$config,'GET',['student-auth','dashboard'])->data;
check(!$data['fees']&&!$data['certificates']&&!$data['notes']&&!$data['results'],'Hidden data leaked');
check($data['fee_summary']['total']===null&&!isset($data['course']['fee'])&&!isset($data['profile']['dob']),'Hidden detail or fee leaked');
foreach(['fees','certificates'] as $kind)check(callPortal($pdo,$config,'GET',['student-auth',$kind,1,'pdf'])->status===403,'Disabled document allowed');
try{handle_exams('GET',['exams','student','available'],$pdo);}catch(PortalResponse $r){check($r->status===403,'Disabled exams allowed');}
check(student_portal_permissions($pdo,2)['fees']===true,'Another student settings changed');
check(accessCall($pdo,'PUT',1,['portal'=>false])->status===200,'Portal disable failed');
check($pdo->query('SELECT COUNT(*) FROM api_tokens WHERE student_id=1')->fetchColumn()==0,'Portal disable did not revoke sessions');
check(callPortal($pdo,$config,'GET',['student-auth','dashboard'])->status===403,'Disabled portal accessible');
check(callPortal($pdo,$config,'POST',['student-auth','login'],['enrollment_no'=>'TEST-1','password'=>'NewPass123'])->status===403,'Disabled portal could login');
echo "PASS: student authentication, ownership, admin-only permissions, persistence, hidden data, denied PDFs/exams and disabled login.\n";

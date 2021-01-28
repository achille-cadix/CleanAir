# CleanAir

CleanAir est une application Android développée en React Native dans le cadre d'un projet entre des élèves de CentraleSupélec et Valéo. 

La fonction de cette application est de récupérer des données d'une carte Arduino grâce au module Bluetooth HC-05. 

Ces données provenant de la carte Arduino proviennent elle-même d'un capteur de pollution PM 2.5 de Valéo.

Ci-dessous se trouve un tutoriel expliquant comment mettre en place un environnement de test à partir du code fourni sur ce repo, et à l'aide d'un smartphone Android.

## Pré-requis téléphone Android

Pour pouvoir utiliser le téléphone Android comme environnement de test, il faut au préalable avoir activé le mode débogage USB https://developer.android.com/studio/debug/dev-options#enable

## Pré-requis ordinateur Windows

Pour pouvoir lancer le code de l'ordinateur vers le téléphone il faut avoir installé les différentes ressources :

ADB qui permet le débogage USB depuis un ordinateur : https://www.xda-developers.com/install-adb-windows-macos-linux/

Node.JS et NPM qui permettent l'execution de code JavaScript : https://nodejs.org/en/

Une fois NPM installé il faut installer les commandes de React Native. Il suffit de lancer l'invite de commande windows et utiliser la commade : *npm install -g expo-cli*

## Téléchargement et préparation de l'environnement

Une fois les pré-requis installés il faut télécharger le code de ce repo, soit à l'aide des commandes git, soit à l'aide de l'interface du site

Il faut ensuite se placer dans le dossier à l'aide de l'invite de commande et lancer la commande *npm install*, cette commande permet de télécharger sur l'envrionnement de test les modules JavaScript.

Si tout s'est bien passé, l'environnement est prêt à être lancé.
 
 ## Lancement de l'application sur le téléphone
 
 Brancher le téléphone en USB à l'ordinateur. On peut vérifier qu'il est bien détécté en utilisant la ligne de commande *adb devices* qui doit donner la liste des téléphones Android branchés sur l'ordinateur
 
 Pour lancer le code, il suffit alors d'utiliser la ligne de commande (quand on est situé dans le répertoire qui correspond à l'application) *react-native run-android*.
 
 Au bout d'un certain temps (en général entre 1 et 5 minutes), et si l'écran du téléphone est allumé, une application devrait s'ouvrir d'elle même.
 
 A priori, à chaque modification apportée au code, l'application devrait se rafraichir en temps réel sur le téléphone.
